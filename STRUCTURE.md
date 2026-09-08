# Project structure

What every folder is for, and why it exists. If you are about to add a file and are
not sure where it goes, this page should answer it in one line.

**This map and the real folder tree must match in both directions.** A folder drawn
here that does not exist on disk — or one on disk that is missing here — is drift, and
drift is how documentation quietly becomes fiction. Both were checked when this file
was written.

## The one idea behind the layout

Dependencies point **inward**, and never back out:

```
routes / UI   →   domain   →   repositories   →   Postgres
(src/app)        (src/domain)   (src/db)
                     ▲
                     └── providers / infra  (adapters for anything external)
```

- A **route** knows about HTTP. It does no arithmetic and no SQL.
- The **domain** knows the rules of the product — what a yearly price is per month,
  what counts as "upcoming". It does not know that HTTP or Postgres exist, which is
  precisely what makes it easy to test.
- A **repository** knows SQL. It does not know the business rules.
- A **provider** wraps something we did not write (the auth library, the error
  reporter), so swapping it later is a one-file change instead of a search-and-replace.

When those directions get violated, you get the classic mess: business logic sprinkled
through React components, SQL in route handlers, and a vendor's SDK imported in fifty
places. Everything below is arranged to make the right thing the easy thing.

## The tree

```
subscription-tracker/
├── src/
│   ├── app/                    # Next.js App Router — every URL lives here
│   │   └── api/                #   HTTP route handlers (thin: parse, authorize, delegate)
│   ├── components/             # React components
│   │   ├── ui/                 #   shadcn/ui primitives (button, input, dialog…)
│   │   ├── features/           #   product-specific composites (SubscriptionCard…)
│   │   └── layout/             #   shell: nav, page frames, containers
│   ├── domain/                 # Business rules. Pure functions, no I/O
│   ├── db/                     # Everything that talks to Postgres
│   │   ├── schema/             #   table definitions (Drizzle) — the source of truth
│   │   └── repositories/       #   queries; every method takes the owning userId
│   ├── providers/              # Adapters for externals, chosen by config
│   ├── infra/                  # Cross-cutting plumbing: logging, request ids, errors
│   ├── auth/                   # Session reading + ownership guards
│   ├── schemas/                # Zod contracts for data crossing a boundary
│   ├── config/                 # The no-hardcoding engine (see below)
│   └── lib/                    # Small shared helpers with nowhere better to live
├── drizzle/                    # Generated SQL migrations — committed, reviewed, applied in order
├── tests/
│   ├── unit/                   #   fast, isolated, no database
│   ├── integration/            #   real Postgres, real contracts between layers
│   └── e2e/                    #   Playwright, driving the real app in a browser
├── docs/
│   └── features/               #   one document per built feature
├── scripts/                    # Developer utilities (seed, reset) — never app runtime code
├── public/                     # Static files served as-is: favicon, images
└── .github/                    # Repository automation (Dependabot now, CI at /foundation)
```

## Folder by folder

### `src/app/` — routes and pages

Next.js maps folders to URLs, so this folder *is* the site map. A folder per route, a
`page.tsx` for what the user sees.

`src/app/api/` holds HTTP route handlers. Keep them **thin**: read the request,
validate it with a schema from `src/schemas/`, get the current user from `src/auth/`,
call one domain function, return a response. If a handler grows past that, the logic
inside it belongs in `src/domain/`.

### `src/components/` — the UI

Split three ways so it stays navigable as it grows:

- **`ui/`** — generic primitives from shadcn/ui. Copied into the repo, so they are ours
  to edit. A button here knows nothing about subscriptions.
- **`features/`** — components that only make sense in *this* product: the subscription
  row, the totals panel, the renewals list.
- **`layout/`** — the frame around a page: navigation, containers, page headers.

Components render and handle interaction. They do not calculate totals — that is
`src/domain/`, where it can be unit-tested without a browser.

### `src/domain/` — the business rules

The most important folder in the repo, and the one with the fewest dependencies.
Normalising a quarterly price to a monthly figure, summing spend per category, deciding
what falls inside the upcoming window — all here, as pure functions taking inputs and
returning outputs.

No database, no HTTP, no React. That constraint is what lets the totals maths be tested
exhaustively in milliseconds, which matters for a product whose entire value is a
number being right.

### `src/db/` — persistence

- **`schema/`** — Drizzle table definitions. The source of truth for the shape of the
  database. Changing a file here is step one; step two is `make generate`, which writes
  a migration into `drizzle/`.
- **`repositories/`** — the queries. One repository per entity, exposing intention-named
  methods (`listForUser`, `findOwnedById`, `deleteOwned`) rather than raw SQL scattered
  around the app.

**Every repository method takes the owning `userId` as a required argument.** This is
deliberate and load-bearing: it means you cannot write a query that forgets whose data
it is reading, because the code will not compile. (ADR-005.)

### `src/providers/` — adapters for anything external

One file per external system, each behind an interface the rest of the app depends on:
the error reporter (`noop` in development, Sentry in production), the clock (real one in
production, a fixed one in tests, so date-dependent tests do not fail at midnight), and
future arrivals like an email sender.

The rule: **a third-party SDK may only be imported inside its own adapter here.** That
is what makes the choice reversible, and what keeps a vendor outage from being a
scattered code change.

### `src/infra/` — cross-cutting plumbing

Things every request needs but no feature owns: the structured logger, request-id
propagation, the shared error-handling wrapper. Not business logic; not a vendor
adapter. The stuff that would otherwise get copy-pasted into every route handler.

### `src/auth/` — who is this, and may they?

Reading the current session (returning a typed user or `null`, never a guess), and the
guards route handlers call to require a logged-in user. Kept apart from `src/providers/`
because auth is not one external among many — it is the thing every data path depends
on, and it should be easy to read end to end.

It fails **closed**: any error reading a session means "not logged in", never "probably
fine".

### `src/schemas/` — the contracts

Zod schemas for anything crossing a boundary: form submissions, API request and response
bodies. The TypeScript types are *inferred* from these schemas, so validation and types
cannot drift apart — there is only one definition.

This folder also does the job a separate `validators/` would: with Zod, describing the
shape and validating against it are the same act, so splitting them would just mean two
files that must agree.

### `src/config/` — the no-hardcoding engine

Three files, and the reason no magic number should ever appear in a `.ts` file:

| File | Holds |
|---|---|
| `platform.yaml` | Engine knobs: timeouts, connection pool, log level, retry counts |
| `product.yaml` | Product knobs: categories, allowed currencies, the 30-day window, input limits |
| `loader.ts` | Reads both, applies `.env` overrides, validates everything, exports a typed config |

The split is by *who would change it*. Shortening a database timeout is an engineering
decision (`platform.yaml`); adding a "Fitness" category is a product one
(`product.yaml`). Secrets appear in neither — they live only in `.env`, which is
gitignored, with their names documented in the committed `.env.example`.

`loader.ts` validates at boot and **throws if anything required is missing or
malformed**. Failing loudly on startup is much better than defaulting silently and
discovering in production that a timeout was zero.

Nothing outside `loader.ts` reads `process.env`. That single rule is what keeps
configuration from leaking back into the code.

### `src/lib/` — shared helpers

Small utilities used across layers: the class-name helper, shared constants, client-side
hooks. **Deliberately last, deliberately small.** The moment something here starts
holding business rules it belongs in `src/domain/`, and the moment this becomes a
dumping ground it has become the god-file this structure exists to prevent.

### `drizzle/` — migrations

Generated SQL files, committed to git and reviewed like any other code, applied in order.
The database schema is never hand-edited and `drizzle-kit push` is never run against a
deployed database. These files are the audit trail of how the schema got to be the way it
is. (ADR-003.)

### `tests/`

Three levels, because they catch different things:

- **`unit/`** — pure logic, no I/O. Totals, cycle normalisation, date windows. Fast
  enough to run constantly.
- **`integration/`** — against a real Postgres. Proves the repositories and their
  contracts actually work, including the cross-account checks: user B must not be able to
  read or touch user A's rows.
- **`e2e/`** — Playwright, driving the real app in a real browser. Proves the whole path
  a person takes, which is the only level that catches "each part works, wired together
  wrong".

### `docs/`

`docs/features/` gets one document per built feature, written as the feature is built.
`PRODUCT.md` and `STRUCTURE.md` sit at the repository root so they are the first thing
seen on GitHub.

### `scripts/`

Developer utilities run by hand or by `make`: seeding the golden dataset, resetting the
local database. Never imported by application code — if the app needs it at runtime, it
belongs in `src/`.

### `public/`

Files served exactly as they are: favicon, images, fonts. No processing, no logic.

### `.github/`

Repository automation. Dependabot configuration today; the CI workflow arrives with
`/foundation`, which is the phase that makes CI mirror the production bootstrap.

## Folders you might expect that are not here

Left out on purpose — an empty folder is a promise the code has not made:

- **`src/jobs/`** — nothing runs on a schedule yet. Renewal reminders are deferred in
  `PRODUCT.md` → Scope, with a recorded trigger; the folder arrives with them.
- **`src/prompts/`** — this is not an AI product. No LLM calls, so no prompts to
  version. AI is a recorded non-goal, not an omission.
- **`src/validators/`** — folded into `src/schemas/`, since Zod makes the shape and its
  validation the same definition.
- **`frontend/` and a separate backend** — this is one Next.js application serving both
  pages and API. Splitting them would mean two deployments and a network hop between our
  own code, for no benefit at this size. (ADR-001.)

## Root files

| File | Purpose |
|---|---|
| `README.md` | What this is, and how to run it |
| `PRODUCT.md` | The spine: vision, scope, plan, architecture, build log |
| `STRUCTURE.md` | This file |
| `CONTRIBUTING.md` | Setup, where code goes, how a change gets merged |
| `SECURITY.md` | How to report a vulnerability privately |
| `CHANGELOG.md` | What changed, in Keep a Changelog format |
| `package.json` | Dependencies, split into production and development |
| `Makefile` | Every task a newcomer needs — start with `make help` |
| `.env.example` | Every environment variable, documented; the only committed env file |
| `.gitignore` | Ignores `.env` and all its variants and backups |
| `.gitleaks.toml` | Secret-scanning rules; the allowlist holds documented dev fakes only |
| `.pre-commit-config.yaml` | Hooks: lint, format, secret scan — run before each commit |
| `docker-compose.yml` | Local Postgres for development |
| `.dockerignore` | Keeps the build context small and secrets out of images |
