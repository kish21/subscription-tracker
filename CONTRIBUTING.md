# Contributing

## Getting set up

```bash
pnpm install          # or: make setup, which also creates .env and installs hooks
cp .env.example .env  # then generate your own BETTER_AUTH_SECRET
make db-up            # start local Postgres
make migrate          # apply migrations
make dev              # http://localhost:3000
```

Run `make help` to see every available task.

## Before you commit

```bash
make check   # typecheck + lint + secret scan + unit tests
```

Pre-commit hooks run the same lint, format and secret scan automatically. Install
them once with `make hooks`. If the secret scanner blocks your commit, **do not
add an allowlist entry to get past it** — remove the secret and rotate it. The
allowlist in `.gitleaks.toml` is for documented local-dev fakes only.

## Where does my code go?

`STRUCTURE.md` maps every folder to its purpose. The short version:

- Business rules (money maths, cycle normalisation, renewal windows) → `src/domain/`
- Anything talking to Postgres → `src/db/repositories/`
- Anything talking to a third-party SDK → `src/providers/`
- The shape of data crossing a boundary → `src/schemas/` (Zod)
- HTTP handling only, no logic → `src/app/api/`

Two rules that are not negotiable, because the product's guarantees rest on them:

1. **Money is integer minor units (cents).** Never a float. See ADR-004.
2. **Every repository method takes the owning `userId`.** There is no query path
   without one. See ADR-005.

And one that keeps the config layer honest: **nothing outside `src/config/loader.ts`
reads `process.env`.** If you need a new tunable value, add it to `platform.yaml` or
`product.yaml` and thread it through the loader.

## Branches, commits, PRs

- Branch from `main`: `feat/…`, `fix/…`, `docs/…`, `chore/…`
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
- One logical change per PR, with the reasoning in the description
- `main` is protected; changes land by squash-merge after CI passes
- Add a `CHANGELOG.md` entry under `[Unreleased]` for anything a user would notice

## Tests

- `tests/unit/` — pure logic, no I/O, fast. Totals and date maths belong here.
- `tests/integration/` — real Postgres, real contracts between layers.
- `tests/e2e/` — Playwright, driving the app the way a person would.

New behaviour needs a test at the lowest level that can actually catch it breaking.
Cross-account access control needs an explicit adversarial test — "user B cannot see
or touch user A's row" — not an assumption.

## Documentation

`PRODUCT.md` is the spine: what this product is, why, what is deliberately out of
scope, and every architectural decision. If you change something it describes,
update it in the same PR. Documentation that quietly stops matching the code is
worse than no documentation.
