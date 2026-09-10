# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project structure: layered `src/` tree (routes → domain → data), with each layer's
  purpose documented in `STRUCTURE.md`.
- Layered configuration: `src/config/loader.ts` with `platform.yaml` (engine knobs)
  and `product.yaml` (product knobs), validated at boot and overridable from `.env`.
- Root scaffolding: `.gitignore`, `.env.example`, `.gitleaks.toml`, pre-commit hooks,
  `Makefile`, `SECURITY.md`, `CONTRIBUTING.md`, `docker-compose.yml` for local Postgres.
- Product decisions recorded in `PRODUCT.md`: vision, scope, plan, and the architecture
  (stack, seven ADRs, adapter table with per-external resilience strategies).
- Authentication & session lifecycle (`M1-SLICE-01`): Better Auth with PostgreSQL Drizzle
  adapter, Argon2id/bcrypt password hashing, secure httpOnly session cookies, and login/signup UI.
- Subscription domain & storage seam (`M1-SLICE-02`): pure financial calculations
  (`src/domain/calculations.ts`) with integer minor units arithmetic (ADR-004), tenant-isolated
  repository (`src/db/repositories/subscription.ts`) enforcing `userId` scoping (ADR-005),
  concurrent idempotency key handling ([ADHOC-03]), SQL LIKE wildcard escaping ([ADHOC-04]),
  and REST API endpoints at `/api/v1/subscriptions`.
- Dashboard experience & north-star event (`M1-SLICE-03`): pure aggregation builder
  (`src/domain/dashboard.ts`) shared by the server-rendered page and `GET /api/v1/dashboard`,
  spend summary / upcoming-renewals / subscriptions table / add-subscription dialog, and the
  privacy-preserving `renewals_viewed` log event (ADR-006). Playwright E2E suite added.

[Unreleased]: https://github.com/kish21/subscription-tracker/commits/main
