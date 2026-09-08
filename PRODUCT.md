<!--
PRODUCT.md — the living spine of this product.

This single file is the shared memory of the product-playbook skills. Each skill
READS the sections it depends on and APPENDS/UPDATES its own. Read it top-to-bottom
to understand the whole product: what it is, why, what's built, and what's next.

Rules:
- A section that is empty/missing = that phase's exit criteria are not yet met.
- Keep entries short and honest. Record HOW something was verified, not just "done".
- Anything explicitly OUT OF SCOPE stays out until the recorded trigger fires.
- Every skill, when it writes back, UPDATES the header line below — bump `Stage:` to its phase
  and set `Last updated:` to today.
-->

# PRODUCT — Subscription Tracker

_Last updated: 2026-09-08 · Stage: Learn (M1-SLICE-02 learnings captured, M1-SLICE-03 next) · AI product? no_

## Vision            <!-- /vision -->
- **Vision sentence:** Anyone can see every subscription they pay for, what it costs per month and year, and what renews next, from any browser, without handing a bank login to a third party or running a server.
- **Who it's for:** An individual with many recurring subscriptions (streaming, software, cloud, gym, news) who loses track of total spend and is surprised by renewals. Uses a laptop as much as a phone.
- **Problem (why now):** Subscription counts per person keep rising and renewals are silent by design. The 2026 tools split into two camps: bank-linked auto-detectors (Rocket Money) that require sharing financial credentials and are US-centric, and private manual trackers (Bobby, Subby) that are iOS-only with no web version. The open-source web option (Wallos) requires self-hosting. There is no private, manual tracker that works in any browser with a normal login.
- **Value proposition:** A private, manual subscription tracker that runs in any browser with a normal account login. No bank linking, no self-hosting, no app store. Adding a subscription takes under a minute; the dashboard answers "what do I pay per month and per year, and what renews next" at a glance.
- **2026 market / competitor read (verified 2026-09-07 via web search, not from memory):**
  - Rocket Money: bank-linked auto-detection, cancellation and bill negotiation; paid; requires financial account access. (rocketmoney.com, cnbc.com/select/best-subscription-trackers)
  - Bobby: manual, privacy-first, iOS-only, no web. (subtracker.io/best/best-subscription-tracker-apps)
  - Subby: manual, iOS-only, iCloud sync, widgets, no data collection. (getfinny.app/blog/best-subscription-tracker-apps-2026)
  - Wallos: open-source self-hosted PHP + SQLite web app; multi-currency, notifications, household sharing; needs your own server or Docker host. (github.com/ellite/Wallos, subvault.io/blog/open-source-subscription-tracker)
  - Sharpening insight: the manual/private camp is phone-only and the web camp is self-host-only. The gap is "manual + private + browser + hosted login".
- **North-star success metric (how we'll know it works):** Weekly active users who log in and view the upcoming-renewals section. Instrumented as a server-side event when the renewals view is rendered for an authenticated user.
- **Job-to-be-done:** When a renewal hits my card unexpectedly, I want to see everything I pay for in one place with amounts and dates, so I can decide what to cancel before the next charge.
- **Riskiest assumption this depends on:** People will keep entering and updating subscriptions manually. Bank-linked apps exist because manual entry lapses. This holds only if adding a subscription is fast (under a minute) and the renewals view is useful enough to return to weekly.
- **Business model (free / paid / internal):** Free. No paid tier planned; no AI/LLM features.

## Validation        <!-- /validate --> (test the riskiest assumption BEFORE code; append a dated entry per run)
- **Assumption under test (falsifiable: <user> will <behaviour> because <reason>):** Individuals with 5+ recurring subscriptions will manually input and track subscriptions weekly without bank syncing.
- **Override 2026-09-07:** Skipped by user decision (building directly for personal/project use) — assumption untested.


## Scope             <!-- /scope -->
- **THE core feature (the one thing):** The subscriptions dashboard: one screen listing every subscription with cost and next renewal date, showing total monthly and yearly spend and what renews in the next 30 days. Everything else feeds this screen.
- **In scope (now):**
  - Account creation and login (email + password) → my data is private and mine. Prerequisite for the north-star "logged-in weekly user".
  - Add / edit / delete a subscription with name, price, billing cycle, category, next renewal date → I can record a subscription in under a minute. Feeds the dashboard.
  - Total monthly and yearly spend, normalised across billing cycles → I know what all this costs me. The reason to look.
  - Upcoming renewals (next 30 days, soonest first) → I see what is about to charge me. Rendering this for a logged-in user IS the north-star event.
  - Filter subscriptions by category, and spend broken down by category → I can find the fat to cut. Drives the cancel decision in the job-to-be-done.
  - One currency per account, chosen at signup → totals are simple and correct.
- **Deferred (out for now + the trigger that would bring it in):**
  - Renewal reminders by email/push — trigger: weekly active users flatten or drop because people forget to open the app.
  - Multi-currency with exchange rates — trigger: a real user needs subscriptions in two currencies on one account.
  - Native iOS/Android app — trigger: responsive web measurably fails on phones (bounce or complaints), after the web app has weekly active users.
  - Mark-as-cancelled with savings total — trigger: users ask "how much have I saved", or the north star needs a second metric.
  - Price history per subscription — trigger: users report editing prices often and losing the old value.
  - CSV export / import — trigger: a user asks to migrate from Wallos, Bobby, a spreadsheet, or leave.
  - Dark mode — trigger: first user request; cheap once the design tokens exist.
  - Admin panel / usage analytics dashboard — trigger: more than one operator, or the north star cannot be read from logs.
  - Paid tier — trigger: hosting cost exceeds what the owner will absorb, or users ask to pay.
- **Non-goals (deliberately never building):**
  - Bank linking / automatic charge detection — contradicts the vision's "no bank login to a third party" promise.
  - Household / shared / multi-user accounts — single-user product; sharing is a different product.
  - AI / LLM features — no AI product; keeps the security surface small.
  - Bill negotiation or cancelling on the user's behalf — Rocket Money's territory, not a private tracker's.

## Plan              <!-- /plan -->
- **Phases / milestones (core first):**
  - **M0 — Walking skeleton.** Repo structure, config from `.env`, structured logging, DB with migrations, one health endpoint, one placeholder page, CI running lint + secret-scan + tests, pre-commit. Produced by /structure, /design-system, /foundation, /contracts.
  - **M1 — Core slice: "I can see what I pay."** Sign up, log in, add a subscription (name, price, cycle, category, renewal date, account currency set at signup), and the dashboard shows it with total monthly and yearly spend and the next-30-days renewals list. Thin end-to-end vertical, not layers. Includes the north-star event.
  - **M2 — Manage and cut: full CRUD + categories.** Edit and delete a subscription, filter the list by category, spend broken down by category. Completes every in-scope item.
  - **M3 — Real users can use it.** Deployed on a public HTTPS URL with the production bootstrap (migrations run, secrets from the host's env, error reporter live), README for users and developers, account deletion so a user can leave, and the north-star metric readable from logs.
- **Timeline (relative; one subtask per session):**
  - M0: ~3 sessions (structure+design · foundation · contracts).
  - M1: ~4 sessions (auth · subscription create · dashboard totals + renewals · north-star event + E2E).
  - M2: ~3 sessions (edit/delete · category filter · category breakdown).
  - M3: ~2 sessions (deploy + account deletion · docs + release).
  - Paid infra: none planned. Hosting uses a free tier; trigger to pay = free tier limits hit by real usage, recorded in Scope#Deferred (paid tier).
- **Exit criteria per milestone (observable, testable):**
  - **M0 done when:** `make ci` (or the equivalent) passes locally and in GitHub Actions on a clean clone; the app starts from `.env.example` values and `GET /health` returns 200 with the DB migrated; a secret-scan and dependency-vuln scan run in CI; a commit with a fake secret is rejected by pre-commit.
  - **M1 done when:** an automated end-to-end test signs up user A, logs in, adds one monthly and one yearly subscription, and the dashboard shows the correct monthly total, yearly total and both renewals in date order; the same test signs up user B and proves B sees none of A's rows and gets 404/403 on A's subscription id; the renewals view emits one structured north-star event per render with the user id and no subscription content; a subscription can be added in under 60 seconds by hand.
  - **M2 done when:** the E2E test edits a price and the totals change accordingly; deletes a subscription and it vanishes from list, totals and renewals; filters by one category and only that category's rows appear; the category breakdown sums equal the monthly total; every write path checks ownership and the authz test proves user B cannot edit or delete A's row.
  - **M3 done when:** a fresh browser on the public URL can sign up, add a subscription, log out, log back in and still see it; HTTPS only, secure httpOnly session cookie, rate-limited signup/login verified by a scripted burst; account deletion removes the user and all their rows (verified by a DB query); README lets a new developer run it locally in under 15 minutes; the north-star count for the last 7 days can be read from logs with one documented command.
- **Concern-area coverage (security · ai · observability · DX · testing · infra · docs · product → now/next/later/N-A + trigger):**
  - **security — NOW (M1):** per-user ownership check on every data path; cookie-based session auth (httpOnly, secure, SameSite), never localStorage tokens; password hashing with a current KDF; input validation at the API boundary; secret-scan + dependency-vuln scan in CI (M0); rate limit on signup/login (M3); CORS locked to the app origin. Data deletion / leave-able account: **NEXT (M3)**, trigger: before the public URL is shared with anyone.
  - **ai-specific — N/A.** No LLM in the product (Vision). Trigger to revisit: an AI feature is reopened via the Non-goal reversal protocol.
  - **observability — NOW (M0/M1):** structured JSON logging with request id; north-star event emitted server-side (M1); error reporter stub in M0, real one at M3. Dashboards/alerting: **LATER**, trigger: first 10 weekly active users or first production incident. Cost-per-run: N/A, no metered externals.
  - **developer-experience — NOW (M0):** README, task runner (Makefile), `.env.example`, pre-commit. OpenAPI docs: NOW if the backend framework gives them for free, else NEXT. CHANGELOG + CONTRIBUTING: **NEXT (M3)**, trigger: first release tag.
  - **testing — NOW (M1):** unit for cycle-normalisation and totals maths; integration for auth + CRUD against a real DB; E2E for the M1/M2 criteria; adversarial authz cases (user B vs A). Golden dataset: a fixed seed of subscriptions with known totals, checked in. Deterministic, run in CI, red blocks merge.
  - **infra — NOW (M0):** CI mirroring the prod bootstrap; schema only via migrations; containerised app; branch protection on `main` once CI exists. Backup/restore: **LATER**, trigger: first real user other than the owner.
  - **documentation — NOW (M0) and per feature:** PRODUCT.md, STRUCTURE.md, DESIGN.md, ADRs from /architect, one doc per feature in docs/features/. Ops runbook: **NEXT (M3)**, trigger: first deploy.
  - **product — NOW:** vision, scope, north star, riskiest assumption, business model all recorded above. Roadmap = this section. Riskiest-assumption check is scheduled at /learn after M3: are people re-entering data weekly?

## Architecture      <!-- /architect -->
- **System kind:** Web app (server-rendered, single-user data, CRUD + arithmetic). **User-facing UI: YES** → `/design-system` runs after `/structure`. Not an AI product.
- **Stack + tools (and why, 2026 OSS-first):**
  - **Next.js (App Router) + React + TypeScript** — one app serves pages and API; no network hop between our own code at this size. Node runtime only (no edge-only APIs) to stay host-agnostic.
  - **Tailwind CSS + shadcn/ui** — the Design section already commits to shadcn-compatible OKLCH tokens; this is the stack that consumes them. Components are copied into the repo (owned, not a dependency).
  - **PostgreSQL** — relational data with real constraints and a real `DATE` type for renewal dates; on the free tier of every host. (SQLite rejected: M3 requires a hosted deploy with durable, backup-able storage.)
  - **Drizzle ORM + drizzle-kit** — typed queries, and migrations as **checked-in SQL files**, which is what "schema only via migrations" requires. (Prisma rejected: heavier runtime + engine binary for no gain here.)
  - **Better Auth** — self-hosted, OSS, first-class email+password with DB-backed httpOnly cookie sessions and a built-in DB-backed rate limiter. (Clerk/Auth0 rejected: paid, and hosting account data with a third party cuts against the vision's privacy promise. NextAuth rejected: credentials + DB sessions is an explicitly discouraged path there.)
  - **Zod** — one schema per boundary payload; TS types are *inferred* from it, so validation and types cannot drift.
  - **pino** — structured JSON logs with a request id; also the transport for the north-star event.
  - **Vitest** (unit + integration) · **Playwright** (E2E) · **Testcontainers or docker-compose Postgres** for integration against a real DB.
  - **Biome** (lint+format, one tool) · **lefthook** (pre-commit) · **gitleaks** (secret scan) · **osv-scanner / `pnpm audit`** (dependency vulns) · **pnpm** · **Docker + docker-compose** · **Makefile** · **GitHub Actions** mirroring the prod bootstrap.
  - **Paid anything: none.** All OSS, all free-tier-runnable. Trigger to spend: free-tier limits hit by real usage (already recorded in Scope#Deferred → paid tier).
- **Key decisions / ADRs (patterns applied · anti-patterns avoided):**
  - **Patterns applied:** (1) **Ports & adapters** — every external sits behind an interface chosen by config. (2) **Layered vertical slices** — `route handler → service → repository`, one slice per feature; dependencies point inward, business logic never imports Drizzle or Better Auth. (3) **Typed contracts end-to-end** — the Zod schema is the single source; no raw `any` crosses a boundary.
  - **Anti-patterns consciously avoided:** distributed monolith (no split backend); vendor lock-in (no host-proprietary runtime APIs); **floats for money**; business logic inside React components or route handlers; tokens in `localStorage`; a god `utils.ts`; N+1 queries on the dashboard.
  - **ADR-001 — One Next.js app, not a split backend+frontend.** *Why:* a solo CRUD app with one screen; a split doubles deploys, test setups and failure modes for zero benefit. *Rejected:* FastAPI backend + Next frontend (distributed monolith at this scale). *Revisit trigger:* a non-web client (native app) leaves Scope#Deferred.
  - **ADR-002 — Better Auth, self-hosted, DB-backed httpOnly cookie sessions.** *Why:* the vision promises the user's data stays in our system, and auth is the easiest place to break that promise. Cookie sessions (httpOnly, Secure, SameSite=Lax) are revocable server-side; localStorage tokens are not. *Rejected:* Clerk/Auth0 (paid + third-party data custody), NextAuth credentials provider.
  - **ADR-003 — Postgres, schema changed only by checked-in migration files.** *Why:* migrations are the audit trail of the schema. `drizzle-kit generate` produces SQL into `drizzle/`, committed and reviewed; `drizzle-kit migrate` applies it as an explicit deploy step. **`db push` is never run against a deployed database**, and the schema is never hand-edited. *Rejected:* SQLite (M3 needs hosted durable storage), auto-sync schema tooling.
  - **ADR-004 — Money is stored and computed as integer minor units (cents), never a float.** *Why:* the whole product is a sum of prices; binary floats make totals wrong in ways that are hard to see and impossible to defend. Cycle normalisation (yearly→monthly etc.) is integer arithmetic, with rounding applied once, at display. *Rejected:* JS `number` for currency, `float8` columns.
  - **ADR-005 — Every repository method takes the owning `userId`; there is no query path without it.** *Why:* the M1/M2 exit criteria require proving user B cannot see or touch user A's rows. Making ownership a *required argument of the data layer* turns "forgot the authz check" into a compile error rather than a code-review miss. Handlers fail **closed**: no session → 401; row not owned → 404 (not 403, so ids are not enumerable).
  - **ADR-006 — The north-star metric is a structured log event, not an analytics vendor.** *Why:* it is one counter (renewals view rendered for a logged-in user), and shipping user behaviour to a third party contradicts the privacy proposition. The event carries `user_id` + timestamp and **no subscription content**, and is readable from logs with one documented command (M3 exit criterion). *Rejected:* PostHog/GA/Plausible for now — trigger to revisit: the metric can no longer be read from logs (already in Scope#Deferred → analytics dashboard).
  - **ADR-007 — Host-agnostic container; deploy target chosen at M3, not now.** *Why:* choosing a host at M0 leaks its primitives into the code. The app must run identically from `docker compose up` locally and from the same image in production: standard `pg` driver, no serverless-only client, no host-proprietary APIs. *Rejected:* building on one platform's runtime/storage primitives.
- **Externals behind provider/adapter interfaces (+ resilience strategy each):**

  | External | Port (interface) | Adapter(s), config-selected | Resilience strategy |
  |---|---|---|---|
  | Postgres | `UserRepository`, `SubscriptionRepository` (every method takes `userId`) | Drizzle / `pg` | Pool size, connect + statement timeouts from `.env`; retry **transient connection errors only** (2 attempts, exponential backoff); never retry a write that may have applied without a natural key; errors logged and surfaced, never swallowed |
  | Auth / session | `SessionReader.getCurrentUser(req) → AuthenticatedUser \| null` | Better Auth | **Fail-closed**: any error reading a session is treated as unauthenticated (401), never as "probably fine". Rate limiter (Better Auth, DB-backed so it holds across instances) on signup/login, thresholds from `.env`, enabled at M3 |
  | Error reporting | `ErrorReporter.capture(err, ctx)` | `noop` (M0/dev) → `sentry` (M3), selected by `ERROR_REPORTER` env | Fire-and-forget with a timeout; a reporting failure must never fail a user request |
  | Logging | `Logger` | pino (JSON, request-id middleware) | Never throws; level from `.env`; no PII or subscription content in the north-star event |
  | Time | `Clock.now()` | `system` \| `fixed` (tests) | Exists so renewal-date maths is deterministic and testable; all comparisons in UTC |
  | Email | `EmailSender` — **N/A now**, port name reserved | none | Trigger: renewal reminders leave Scope#Deferred, or password-reset / email-verification is added |

  - **Rule this table enforces:** no vendor SDK is imported in a service or a React component — only inside its adapter in the infrastructure layer.
- **Resilience · perf/cost budget · migrations approach:**
  - **Resilience:** fail-**closed** on anything auth/ownership; fail-**loud** at boot — a Zod-validated env schema, where a missing or malformed variable aborts startup rather than defaulting silently; graceful degradation only where it is safe (error reporter down → keep serving).
  - **Perf/cost budget — ⚠️ ASPIRATIONAL, not measured.** No code exists yet, so this is not probed. **Dominant cost named:** the dashboard render = Postgres round-trip(s) over the user's rows + SSR. **Budget to hold:** dashboard p95 server response **< 400 ms** with 200 subscriptions on free-tier hosting, and **≤ 3 DB queries per dashboard render** (list · totals · upcoming — collapsed further if measurement says so; this is the N+1 guard). **Cost: $0/month** (no metered externals, no LLM). **Committed: re-measure both at `/eval` and replace these numbers with the measured ones.**
  - **Migrations:** per ADR-003 — `drizzle-kit generate` → SQL files in `drizzle/`, committed and code-reviewed; applied by an explicit `drizzle-kit migrate` step in the container's start/deploy path; CI runs migrations from an empty database on every build so a broken migration fails before merge; no `db push` against a deployed DB; schema never hand-edited.
  - **No hardcoding / no secrets in code:** every value — `DATABASE_URL`, `BETTER_AUTH_SECRET`, session TTL, rate-limit thresholds, pool size + timeouts, log level, `ERROR_REPORTER` + DSN, default currency, app origin for CORS — lives in `.env`, is validated by the env schema at boot, and is documented in a committed `.env.example`. `.env` is gitignored; gitleaks runs in pre-commit **and** CI. No secret is ever read in client-side code.
- **(AI) prompt-versioning · eval harness · tracing:** **N/A — not an AI product** (Vision: no LLM features; AI is a recorded Non-goal). No prompts, no model calls, so no prompt-versioning, eval harness or LLM tracing. *Trigger to revisit:* an AI feature is reopened via the Non-goal reversal protocol, at which point all three become ADRs before any model call is written.

## Structure         <!-- /structure --> (see STRUCTURE.md for the full folder map)
- **Shape:** single Next.js app (ADR-001) — routes, UI and API in one `src/` tree, layered so dependencies point inward: `src/app` (routes/UI) → `src/domain` (rules) → `src/db/repositories` (SQL) → Postgres, with `src/providers` + `src/infra` off to the side for anything external or cross-cutting.
- **Folder → purpose map (summary):**
  - `src/app/` — Next.js App Router; every URL. `src/app/api/` = thin HTTP handlers (parse · authorize · delegate), no logic.
  - `src/components/` — `ui/` (shadcn primitives) · `features/` (subscription-specific) · `layout/` (shell). Render only; totals maths lives in `domain/`.
  - `src/domain/` — the business rules as pure functions (cycle normalisation, totals, upcoming-window). No I/O, so it is exhaustively unit-testable.
  - `src/db/` — `schema/` (Drizzle tables, source of truth) · `repositories/` (intention-named queries; **every method takes the owning `userId`**, ADR-005).
  - `src/providers/` — one adapter per external (error reporter, clock, future email). A vendor SDK may be imported **only** inside its own adapter.
  - `src/infra/` — cross-cutting plumbing: structured logger, request-id propagation, shared error wrapper.
  - `src/auth/` — session reading (fails **closed**) + ownership guards. Separate from `providers/` because every data path depends on it.
  - `src/schemas/` — Zod contracts for boundary payloads; TS types inferred from them, so validation and types cannot drift. (Absorbs the usual `validators/`.)
  - `src/config/` — the no-hardcoding engine (below). `src/lib/` — small shared helpers, deliberately last and deliberately small.
  - `drizzle/` — generated migration SQL, committed + reviewed. `tests/` — `unit/` (no I/O) · `integration/` (real Postgres, incl. cross-account authz) · `e2e/` (Playwright).
  - `docs/features/` (one doc per feature) · `scripts/` (seed/reset, never runtime) · `public/` (static) · `.github/` (Dependabot now; CI at /foundation).
- **Config layering scaffolded (the no-hardcoding engine):** `src/config/platform.yaml` (engine knobs: pool, timeouts, retries, session TTL, rate limits, log level, error-reporter) + `src/config/product.yaml` (product knobs: categories, allowed currencies, 30-day renewal window, billing cycles + months, input limits) + `src/config/loader.ts` (typed Zod loader: YAML → `.env` overrides → validated, cached `AppConfig`). **Verified: `process.env` is read in `loader.ts` and nowhere else in `src/`.** Loader throws at boot on a missing/malformed value, and on `ERROR_REPORTER=sentry` without a DSN.
- **Root scaffolding present:** `README.md` · `STRUCTURE.md` · `CONTRIBUTING.md` · `SECURITY.md` (private-disclosure policy) · `CHANGELOG.md` (Keep a Changelog, `[Unreleased]` seeded) · `.gitignore` · `.env.example` · `.gitleaks.toml` · `.pre-commit-config.yaml` · `Makefile` (`make help` lists every task) · `package.json` (prod/dev split, versions checked against the live npm registry 2026-09-08, not recalled) · `docker-compose.yml` (local Postgres 18) · `.dockerignore` · `.github/dependabot.yml`.
- **Secret hygiene verified:** `git check-ignore` confirms `.env`, `.env.local`, `.env.production`, `.env.bak`, `.env.backup`, `app.env`, `prod.env.local` are all ignored and `.env.example` is the only committed env file. No secret in any code file. `.gitleaks.toml` allowlist holds two documented local-dev fakes only (`.env.example` placeholder, local compose password).
- **Map↔tree agreement (both directions) verified:** all 26 on-disk folders appear in `STRUCTURE.md`; the four folders it names as deliberately absent (`src/jobs/`, `src/prompts/`, `src/validators/`, `frontend/`) are confirmed absent, each with the reason recorded.
- **Prompts location (AI): N/A — not an AI product.** No `prompts/` folder; AI is a recorded Non-goal (Vision/Scope). Trigger to create one: an AI feature is reopened via the Non-goal reversal protocol.
- **Has user-facing UI: YES** → `/design-system` runs next, before any screens are built.

## Design             <!-- /design-system --> (UI products only; see DESIGN.md for the full system)
- **Has user-facing UI?** YES (Web application dashboard for personal recurring subscription tracking).
- **Design principles (5, derived from vision):**
  1. Calm Financial Clarity (no sensory overload, clean slate canvas)
  2. Tabular Numeric Discipline (JetBrains Mono, right-aligned currency, tabular-nums)
  3. Restraint & Single Accent (Deep Teal-Slate `oklch(0.48 0.09 230)` / `oklch(0.66 0.10 220)`)
  4. Thumb-First Mobile Ergonomics (touch targets >= 44px, mobile table-to-card reflow)
  5. Quiet Restraint in Motion (Tier 0 CSS transitions only, 140ms ease, opacity/transform only)
- **Archetype (aesthetic family + why it fits):** Calm Authority / Trust (with Data-Dense Pro precision). Fits personal finance where clarity, credibility, and dense scannability outweigh marketing flare.
- **Foundations summary (font pairing · base body size + type scale · one accent + palette · density · depth · motion):**
  - Fonts: `Geist` (display/body) + `JetBrains Mono` (numbers/data/dates)
  - Base body: 16px (1rem), Scale ratio 1.20 (Minor Third)
  - Colors: Dominant Cool Neutral/Slate + Deep Teal-Slate accent (`oklch(0.48 0.09 230)` light / `oklch(0.66 0.10 220)` dark)
  - Density: Medium-compact (financial dashboard), max-width 1200px
  - Depth: Hairline borders (`1px solid var(--border)`), subtle elevation (`--shadow-sm` on cards), zero nested cards
  - Motion: Tier 0 CSS transitions (140ms, transform/opacity only), full reduced-motion support
- **Tokens:** shadcn/ui-compatible CSS variables (OKLCH), WCAG-AA verified (Light: 15.74:1 body, 6.22:1 btn; Dark: 14.85:1 body, 6.88:1 btn) — see `DESIGN.md`.
- **Approved sample page (path):** `preview.html` · **DESIGN.md (path):** `DESIGN.md`

## Foundation        <!-- /foundation -->
- **Runs end-to-end (walking skeleton):** YES. Next.js 16 (Turbopack) boots in 522ms; `GET /api/health` returns HTTP 200/503 with structured JSON (`status`, `version`, `timestamp`, `env`, `database` connectivity & latency); root route `/` renders walking skeleton view. Verified live against `http://localhost:3000`.
- **Config flows verified (no dead config):** Verified by `tests/unit/config.test.ts` (6 passing tests). Three-tier layering works: `platform.yaml` + `product.yaml` loaded, `.env` overrides flow through, read back at runtime.
- **Fail-loud/fail-closed guards · secret-scan + dependency-vuln scan · CI mirrors prod:**
  - Fail-loud guards refuse boot on missing `BETTER_AUTH_SECRET`, `< 32` char secrets, known placeholder constants, missing `DATABASE_URL`, and `ERROR_REPORTER=sentry` without `SENTRY_DSN`.
  - Secret scan: `gitleaks` via `.gitleaks.toml` and GitHub Actions.
  - Dep-vuln scan: `pnpm audit` verified clean (0 vulnerabilities after esbuild override).
  - CI: `.github/workflows/ci.yml` runs lint/format (Biome), typecheck (TypeScript), secret scan (Gitleaks), dep scan (`pnpm audit`), and test+build against Postgres 18 container.
- **pre-commit + CI auto-run (lint/format/secret-scan/tests) · runs in its container · async-safe:**
  - `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass cleanly with 0 errors.
  - Dependabot bot active in `.github/dependabot.yml`.
  - Event loop unblocked: async pool with statement and connection timeouts.
- **Observability wired (tracing / error-reporter, even a stub):**
  - Structured JSON logging via `pino` with request IDs and secret redaction (`src/infra/logger.ts`).
  - Standardized error hierarchy (`src/infra/errors.ts`).
  - Error reporter adapter (`src/providers/error-reporter.ts` with noop/sentry).
  - Deterministic clock adapter (`src/providers/clock.ts` with `SystemClock` / `FixedClock`).

## Contracts         <!-- /contracts -->
- **Typed models / schemas / migrations:**
  - **Core Domain Entities:** Defined as pure TypeScript models in `src/domain/types.ts` (`Subscription`, `User`, `BillingCycle`, `Category`, `UpcomingRenewalItem`, `CategorySpendBreakdown`, `DashboardSummary`).
  - **Boundary Contracts:** Typed Zod schemas with inferred TS types in `src/schemas/` (`auth.ts`, `subscription.ts`, `dashboard.ts`, `events.ts`, `common.ts`). All endpoint payloads strictly typed; no `any` crosses boundaries.
  - **Persistence Schema:** Drizzle ORM in `src/db/schema/index.ts` declaring 6 tables (`user`, `session`, `account`, `verification`, `subscriptions`, `system_heartbeat`) with relational bindings and cascading deletes.
  - **Migrations Audit:** Schema changes via checked-in SQL files only. Initial migration `drizzle/0000_overconfident_ultimates.sql` generated via `drizzle-kit generate`. `db push` forbidden against deployed DBs.
  - **Registry Pinning & Golden Fixtures:** Pinned by `tests/unit/contracts-pin.test.ts` (12 tests) ensuring `product.yaml` categories, billing cycles, allowed currencies, and migration SQL columns are in lockstep. Seed fixture committed in `tests/fixtures/subscriptions.fixture.json`.
- **Boundary units/scale agreed:**
  - **Money:** Stored and exchanged strictly as **integer minor units** (`priceMinorUnits` in cents/pence/paise, integer >= 0). ADR-004 enforced; floats rejected at boundary and in domain arithmetic (`toMinorUnits`, `fromMinorUnits`).
  - **Dates:** Stored as PostgreSQL `date` (`DATE`); boundary wires strictly use ISO-8601 calendar strings (`YYYY-MM-DD`). Timezone-neutral calendar date representation prevents midnight shifting bugs.
  - **Billing Cycles:** Mapped explicitly to months: `monthly` = 1, `quarterly` = 3, `semiannual` = 6, `yearly` = 12. Normalisation arithmetic uses integer division and rounding once at display.
  - **Percentage:** Bounded 0.0 to 100.0 (percentage scale, not fraction 0.0 to 1.0) and rounded to 1 decimal place at boundary.
  - **Window:** Integer days (30 days default from `product.yaml`).
  - **Currency:** ISO-4217 3-letter code (`USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`) chosen at signup and inherited by all subscriptions.
- **Contract versioning / back-compat approach:**
  - REST endpoints versioned under `/api/v1/` (`/api/v1/auth/*`, `/api/v1/subscriptions/*`, `/api/v1/dashboard`). Health check at `/api/health`.
  - Additive-only schema evolution (new optional fields allowed without major bump; breaking changes require `/api/v2/`).
  - Standard JSON response envelope: `{ "success": true, "data": ... }` and `{ "success": false, "error": { "code", "message", "details" } }`.
  - Documented in OpenAPI 3.1 specification (`docs/api/openapi.json`) and `docs/contracts.md`.
- **PII/sensitive fields classified · tenant-owner key · idempotency/natural key:**
  - **PII Classification:** Passwords hashed with Argon2id / bcrypt via Better Auth. User email classified as sensitive PII. Subscription financial prices and names are NEVER logged or exported to analytics.
  - **Tenant / Owner Key:** Every subscription requires owning `userId` referencing `user.id`. Enforced as a required argument on repository methods (ADR-005). Fast lookup via compound index `(user_id, next_renewal_date)`. Handlers fail closed (404 on unowned records, preventing id enumeration).
  - **Natural & Idempotency Keys:** User natural key is unique normalized `email`. Subscription creation supports optional client `idempotencyKey` backed by compound unique index `(user_id, idempotency_key)`.
  - **North-Star Event Contract:** Structured log event `renewals_viewed` emitted server-side carrying only `userId`, `timestamp`, `upcomingCount`, `windowDays`, with zero financial or subscription content.

## Build log         <!-- /build --> (one entry per feature; see docs/features/*)
| Feature | DoD (incl. security) met? | How verified | Doc |
|---|---|---|---|
| M1-SLICE-01 Authentication & Session Lifecycle | YES (Argon2/bcrypt KDF in DB, httpOnly Lax cookie, fail-closed guards, Zod boundary validation, no secrets) | Integration suite (12 tests against Postgres), unit suite (29 tests), frontend-audit (0 errors), live browser signup/login/logout flow | [docs/features/auth.md](docs/features/auth.md) |
| M1-SLICE-02 Subscription Domain & Storage Seam | YES (Tenant isolation on all queries ADR-005, integer minor units ADR-004, fail-closed 401, log redaction, idempotency guard) | Integration suite (10 tests in subscriptions.test.ts against Postgres), unit suite (15 tests in calculations.test.ts), live HTTP curl/fetch (signup, create, list) | [docs/features/subscriptions-crud.md](docs/features/subscriptions-crud.md) |

## Dev-complete      <!-- /dev-check -->
- [ ] Every core-scope feature built & runs
- [ ] Exit criteria + security DoD verified (with evidence)
- [ ] No hardcoding · prompts externalized · contracts typed · builds green
- [ ] Scope re-check — nothing crept in

## Tests             <!-- /test -->
- **Unit / integration / regression coverage (critical path accounted for):**
- **Adversarial/security (prompt-injection, authz) cases:**
- **Live-path verified (not just isolated units):**
- **Golden/eval dataset location · tests deterministic · run in CI (red blocks merge):**

## Evaluation        <!-- /eval -->
- **Is it good? (measured vs a recorded baseline; regression fails):**
- **Metrics + confidence score:**
- **Cost-per-run · (AI) scoring-bias:**
- **Operational failures (separated from quality):**

## Ship log          <!-- /ship -->
| Date | What shipped | Review + /security-review | Docs reconciled | CHANGELOG | Rollback / flag | PR |
|---|---|---|---|---|---|---|
| 2026-09-08 | M1-SLICE-02 Subscription Domain & Storage Seam | DEEP: adversarial isolation, integer minor units, 44 unit + 24 integration tests passed, race condition [ADHOC-03] & wildcard escaping [ADHOC-04] fixed | docs/features/subscriptions-crud.md & docs/issues/ reconciled | Updated [Unreleased] in CHANGELOG.md | git revert / migration-down | [PR: M1-SLICE-02](https://github.com/kish21/subscription-tracker/pulls) |

## Learnings         <!-- /learn -->
- **Success metric + result (instrumented, not guessed):** North-star metric (*Weekly active users who log in and view upcoming-renewals*) contract defined (`renewals_viewed` event in `src/schemas/events.ts`); UI emission scheduled for M1-SLICE-03. Current engineering metrics: 44 unit tests (100% pass), 24 integration tests (100% pass), 0 lint/type errors, 0 duplicate rows on concurrent idempotency collisions.
- **User/usage signal incorporated:** Live verification and review exposed two edge cases: (1) concurrent double-submissions with `idempotencyKey` caused unhandled PostgreSQL 23505 errors; fixed via graceful fallback to existing record ([ADHOC-03]); (2) unescaped `_` and `%` in searches altered query semantics; fixed via `escapeLikePattern` ([ADHOC-04]).
- **Retro (what worked / what to change):**
  - *What worked:* Mandatory `userId` on all repository queries (ADR-005) made tenant leaks impossible at compile time; integer minor units (ADR-004) eliminated floating-point distortion.
  - *What to change:* Vitest integration tests against single local Postgres container must run sequentially (`fileParallelism: false`) to prevent inter-file table truncation races.
- **Reusable learning harvested:**
  - Database-backed integration test suites in Vitest sharing a single test DB require `fileParallelism: false`.
  - Idempotency key stores backed by unique DB constraints should always catch unique constraint violations and re-read the existing record to survive concurrent in-flight retries.
- **Decided next — build / iterate / KILL (from evidence):** **BUILD** [M1-SLICE-03] Dashboard Experience & North Star Event (`docs/issues/M1-SLICE-03_dashboard_experience_north_star.md`). Auth (Slice 1) and Storage/Math (Slice 2) are fully proven; completing Slice 3 finishes Milestone 1 and delivers THE core feature to the user.
- **Observability + cost watch in place:** Structured logging with secret redaction active; free-tier Postgres with 0 external metered APIs ($0/month cost). North-star log event transport ready for Slice 3.

## Drift log         <!-- /drift-check (run anytime) -->
| Date | Drift found (scope/vision/plan/docs) | Recommendation (cut / re-scope+trigger / fix) |
|---|---|---|
| 2026-09-08 | Doc drift resolved: PRODUCT.md stage bumped to Build, README.md status banner updated, M1-SLICE-01 ticket tasks checked off. Vision standing finding: untested riskiest assumption (Validation override). Scope: 0 creep. Codebase clean. | Fixed on 2026-09-08. Status: On-track. |

