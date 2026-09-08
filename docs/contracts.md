# Contracts & Boundaries Specification

> **Phase 2 · Development ④ — Contracts**  
> Living specification of domain models, persistence schemas, boundary payloads, unit/scale conventions, and data safety classifications.

---

## 1. Domain Entities & Type Models

All core domain models are strictly typed and located in [`src/domain/types.ts`](file:///c:/Users/kishore/Downloads/subscription-tracker/src/domain/types.ts):

| Domain Entity | Key Fields | Type / Representation | Storage & Boundary Rules |
|---|---|---|---|
| **User** | `id`, `name`, `email`, `currency`, `createdAt` | TypeScript `interface User` | Account currency chosen at signup from `ALLOWED_CURRENCIES` (USD, EUR, GBP, INR, CAD, AUD). |
| **Subscription** | `id`, `userId`, `name`, `priceMinorUnits`, `billingCycle`, `category`, `nextRenewalDate`, `status` | TypeScript `interface Subscription` | `priceMinorUnits` is an integer count of minor units (cents). `userId` is mandatory tenant key. `nextRenewalDate` is ISO calendar date (`YYYY-MM-DD`). |
| **UpcomingRenewalItem** | `id`, `name`, `priceMinorUnits`, `renewalDate`, `daysUntilRenewal` | TypeScript `interface UpcomingRenewalItem` | Filtered to `0 <= daysUntilRenewal <= upcomingWindowDays` (default 30 days). |
| **CategorySpendBreakdown** | `category`, `totalMonthlyMinorUnits`, `percentage`, `subscriptionCount` | TypeScript `interface CategorySpendBreakdown` | Monthly normalized minor units; `percentage` bounded [0.0, 100.0]. |
| **DashboardSummary** | `totalMonthlyMinorUnits`, `totalYearlyMinorUnits`, `currency`, `upcomingRenewals`, `categoryBreakdown` | TypeScript `interface DashboardSummary` | Arithmetic aggregated using pure cycle normalisation formulas. |

---

## 2. Boundary Unit & Scale Matrix

*Avoids the classic "0–1 vs 0–10" scale traps or float representation errors across all system seams.*

| Field / Concept | Left Side (API / Wire) | Right Side (Service / DB) | Unit & Scale Agreement | Failure Mode Prevented |
|---|---|---|---|---|
| **Price / Money** | `priceMinorUnits: integer` (e.g. `1499`) | Postgres: `integer` (cents) | **Integer minor units (cents/pence/paise)**. 1 major unit = 100 minor units. Floats forbidden. | Floating-point decimal rounding errors ($14.99 + $0.01 = $15.000000000000002). |
| **Next Renewal Date** | `nextRenewalDate: string` (`YYYY-MM-DD`) | Postgres: `date` (`DATE`) | **ISO-8601 calendar date**. Timezone-neutral calendar date. | Timezone drift shifting renewal by ±1 day across midnight. |
| **Billing Cycle** | `billingCycle: enum` | Postgres: `varchar(32)` | `'monthly' \| 'quarterly' \| 'semiannual' \| 'yearly'` mapped to 1, 3, 6, 12 months. | Misinterpreting quarterly as 4 months instead of 3. |
| **Spend Breakdown %** | `percentage: number` | Domain calculation | Bounded **0.0 to 100.0** (percentage scale, not 0.0 to 1.0 fraction). Rounded to 1 decimal place at boundary. | Scale mismatch where 25% is shown as 0.25%. |
| **Upcoming Window** | `windowDays: number` | Config: `renewals.upcoming_window_days` | **Integer days** (default `30` days). | Disagreement on renewal cutoff window. |
| **Account Currency** | `currency: string` (`USD`, `EUR`, etc.) | Postgres: `varchar(3)` | ISO-4217 3-letter currency code. Inherited by all subscriptions for that user. | Multi-currency mismatch or unstated currency totals. |

---

## 3. Persistence Schema & Migrations

- **ORM**: Drizzle ORM ([`src/db/schema/index.ts`](file:///c:/Users/kishore/Downloads/subscription-tracker/src/db/schema/index.ts)).
- **Migrations Location**: [`drizzle/`](file:///c:/Users/kishore/Downloads/subscription-tracker/drizzle).
- **Initial Migration**: `drizzle/0000_overconfident_ultimates.sql`.
- **Policy**:
  - Schema changes are executed **exclusively** via checked-in SQL migrations generated with `drizzle-kit generate`.
  - Schema is **never hand-edited**.
  - `db push` is strictly forbidden against deployed environments.
  - Foreign key cascading: deleting a user cascades to all sessions, accounts, and subscriptions.

### Indexes & Performance Seams
1. `subscriptions_user_idx`: B-Tree index on `(user_id)` for tenant-isolated list queries.
2. `subscriptions_user_renewal_idx`: Compound B-Tree index on `(user_id, next_renewal_date)` for fast upcoming renewals query (ensuring dashboard latency p95 < 400ms).
3. `subscriptions_user_idempotency_idx`: Compound unique index on `(user_id, idempotency_key)` to enforce safe write retries.

---

## 4. API Contracts & Versioning

- **Prefix**: `/api/v1/` for domain business endpoints; `/api/health` for orchestrator liveness/readiness.
- **Versioning Strategy**: Additive-only evolution. New optional fields may be introduced without bumping version; breaking changes require `/api/v2/`.
- **Envelope Convention**:
  - Success: `{ "success": true, "data": { ... } }`
  - Failure: `{ "success": false, "error": { "code": "STRING", "message": "Readable", "details": ... } }`
- **Specification**: OpenAPI 3.1 file at [`docs/api/openapi.json`](file:///c:/Users/kishore/Downloads/subscription-tracker/docs/api/openapi.json).

---

## 5. Idempotency & Data Safety

| Concern | Implementation | Evidence / Seam |
|---|---|---|
| **Tenant Isolation** | Every subscription query and mutation requires `userId` as a first-class parameter (ADR-005). Fails closed (404, not 403, preventing enumeration). | `subscriptions.user_id` FK + unique/compound indexes. |
| **Write Idempotency** | Optional client-supplied `idempotencyKey` on `POST /api/v1/subscriptions`. | Unique index `(user_id, idempotency_key)`. |
| **PII & Credentials** | Passwords hashed using Better-Auth Argon2id / bcrypt. Email marked sensitive. Subscription contents NEVER logged or exported to third parties. | Redacted in `logger.ts`. |
| **North-Star Event** | Server-side structured log event `renewals_viewed` containing `userId`, `timestamp`, `upcomingCount`, `windowDays`. **Contains zero financial or subscription data**. | Validated by `northStarEventSchema`. |
