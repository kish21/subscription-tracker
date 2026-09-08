# Feature: Subscription Domain & Storage Seam

- **Ticket:** [M1-SLICE-02] Subscription Domain & Storage Seam (`docs/issues/M1-SLICE-02_subscription_domain_storage.md`)
- **Status:** Complete & Verified
- **Date:** 2026-09-08

## 1. What was built

Implemented the pure financial domain arithmetic, tenant-isolated persistence repository, and REST API route handlers for subscription management:
- **Pure Financial Domain Arithmetic (`src/domain/calculations.ts`)**:
  - Cycle normalisation (monthly, quarterly, semiannual, yearly converted to monthly/yearly integer minor units / cents per ADR-004).
  - Timezone-neutral calendar date parsing (`parseCalendarDate`) and days calculation (`calculateDaysUntilRenewal`).
  - Upcoming renewal filtering (`filterUpcomingRenewals`) within configurable window (default: 30 days), sorted soonest first.
  - Category spend breakdown (`calculateCategorySpendBreakdown`) with percentage rounded to 1 decimal place.
  - Spend totals calculation (`calculateTotalSpend`) across active subscriptions, ignoring cancelled rows.
- **Tenant-Scaffolded Subscription Repository (`src/db/repositories/subscription.ts`)**:
  - ADR-005 enforced: every repository method (`create`, `findById`, `findByIdempotencyKey`, `list`, `update`, `delete`) requires `userId: string` as the first argument, turning accidental missing authorization into compile-time errors.
  - Idempotency key handling: supports client `idempotencyKey` preventing duplicate creation on retried requests.
  - Rich filtering: category filtering, active/cancelled status filtering, and case-insensitive search.
- **REST API Route Handlers (`src/app/api/v1/subscriptions/route.ts`)**:
  - `POST /api/v1/subscriptions`: Creates subscriptions with Zod validation (`createSubscriptionSchema`), inherits account currency, excludes financial amounts/names from server logs.
  - `GET /api/v1/subscriptions`: Lists subscriptions scoped strictly to authenticated tenant, with query param filtering (`subscriptionQuerySchema`).

## 2. Contract & Boundary Types

- **Consumes:** `createSubscriptionSchema` / `CreateSubscriptionInput`, `subscriptionQuerySchema` / `SubscriptionQueryInput` (`src/schemas/subscription.ts`)
- **Exposes:**
  - `subscriptionResponseSchema` / `SubscriptionResponse` (`src/schemas/subscription.ts`)
  - `subscriptionListResponseSchema` / `SubscriptionListResponse` (`src/schemas/subscription.ts`)
  - `SubscriptionRepository` interface (`src/db/repositories/subscription.ts`)
  - Domain calculation functions (`src/domain/calculations.ts`)

## 3. Definition of Done & Security Audit

- [x] **Tenant Scoping (ADR-005):** Every repository method requires `userId`. No query path exists without tenant isolation.
- [x] **Integer Minor Units (ADR-004):** Money is strictly stored and calculated as integer minor units (`priceMinorUnits`, integer >= 0, cents). Floats are strictly rejected at the schema boundary.
- [x] **Input Validation:** Zod schemas validate closed sets for category and billing cycle, format for calendar dates (YYYY-MM-DD), and positive integer limits.
- [x] **Fail-Closed Security:** Unauthenticated requests to `/api/v1/subscriptions` immediately return HTTP 401 Unauthorized.
- [x] **Log Redaction:** Subscription names and financial prices are excluded from logs (logs only carry `userId`, `subscriptionId`, `billingCycle`, and `category`).
- [x] **Adversarial Authz Isolation:** Verified by automated tests: User B cannot find, list, edit, or delete User A's subscriptions, and receives 0 rows when requesting subscriptions.
- [x] **Idempotency Guard:** Retrying a creation request with the same `idempotencyKey` returns the existing subscription rather than creating duplicates.

## 4. How Verified

1. **Unit Test Suite (`tests/unit/calculations.test.ts`):**
   - 15/15 passing unit tests verifying date parsing, days until renewal, upcoming window boundaries (30 days vs 31 days), cycle normalisation arithmetic, and category spend breakdowns.
2. **Integration Test Suite (`tests/integration/subscriptions.test.ts`):**
   - 12/12 passing integration tests against PostgreSQL database.
   - Verified tenant isolation, adversarial cross-user isolation, idempotency key deduplication, concurrent race condition resilience ([ADHOC-03]), SQL wildcard character escaping ([ADHOC-04]), category and status filtering, and HTTP 200/201/400/401 API route responses.
3. **Full Automated Suite:**
   - Unit tests: 44/44 passed (`pnpm test`).
   - Integration tests: 24/24 passed (`pnpm test:integration`).
   - Linter: Biome 0 errors (`pnpm lint`).
   - Typecheck: TypeScript 0 errors (`pnpm typecheck`).
4. **Live Path HTTP Verification:**
   - Tested against running Next.js dev server:
     - Verified unauthenticated `GET /api/v1/subscriptions` returns HTTP 401.
     - Registered live user via `POST /api/auth/sign-up/email`.
     - Created subscription with 28900 minor units ($289.00), yearly cycle, Software category via `POST /api/v1/subscriptions` -> returned HTTP 201 Created with JSON envelope.
     - Fetched subscription list via `GET /api/v1/subscriptions` -> returned HTTP 200 OK with `totalCount: 1`.
