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

[Unreleased]: https://github.com/kish21/subscription-tracker/commits/main
