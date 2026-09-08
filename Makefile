# Task runner. Every command a newcomer needs, discoverable with `make help`.
# Nothing here is magic — each target is one command you could type yourself.

.DEFAULT_GOAL := help
.PHONY: help setup dev build start db-up db-down db-logs migrate generate seed reset \
        lint format typecheck test test-integration test-e2e check ci hooks clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# --- first run -------------------------------------------------------------

setup: ## Install dependencies + git hooks, and create .env if missing
	pnpm install
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example — edit BETTER_AUTH_SECRET before running.")
	$(MAKE) hooks

hooks: ## Install the pre-commit hooks (lint + format + secret scan)
	pre-commit install

# --- running ---------------------------------------------------------------

dev: ## Run the app in development mode (http://localhost:3000)
	pnpm dev

build: ## Production build
	pnpm build

start: ## Serve the production build
	pnpm start

# --- database --------------------------------------------------------------

db-up: ## Start the local Postgres container
	docker compose up -d db

db-down: ## Stop the local Postgres container (keeps data)
	docker compose down

db-logs: ## Tail the local Postgres logs
	docker compose logs -f db

generate: ## Generate a new SQL migration from the schema (drizzle/)
	pnpm db:generate

migrate: ## Apply pending migrations to the database
	pnpm db:migrate

seed: ## Load the golden dataset (fixed subscriptions with known totals)
	pnpm db:seed

reset: ## Drop, re-migrate and re-seed the local database — DESTRUCTIVE, local only
	pnpm db:reset

# --- quality ---------------------------------------------------------------

lint: ## Lint + format check + secret scan (no writes)
	pnpm lint
	pre-commit run --all-files

format: ## Auto-fix formatting and safe lint issues
	pnpm format

typecheck: ## TypeScript, no emit
	pnpm typecheck

test: ## Unit tests (fast, isolated, no database)
	pnpm test

test-integration: ## Integration tests (real database, real contracts)
	pnpm test:integration

test-e2e: ## End-to-end browser tests
	pnpm test:e2e

check: ## Everything a commit should pass: typecheck + lint + unit tests
	$(MAKE) typecheck
	$(MAKE) lint
	$(MAKE) test

ci: ## What CI runs — the full gate, including integration + e2e
	$(MAKE) check
	$(MAKE) test-integration
	$(MAKE) test-e2e

# --- housekeeping ----------------------------------------------------------

clean: ## Remove build output and caches
	rm -rf .next coverage playwright-report test-results *.tsbuildinfo
