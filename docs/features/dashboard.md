# Dashboard Experience & North-Star Event (M1-SLICE-03)

**Ticket:** [M1-SLICE-03](../issues/M1-SLICE-03_dashboard_experience_north_star.md) · GitHub [#3](https://github.com/kish21/subscription-tracker/issues/3)
**Built:** 2026-09-10 · **Milestone:** M1 — Core slice: "I can see what I pay"

## What it does

The dashboard answers the product's one question: *what am I actually paying for, and what is
about to charge me?* For a logged-in user it renders

- **monthly and yearly spend**, normalised across billing cycles,
- **upcoming renewals** inside the configured window (30 days), soonest first,
- **every tracked subscription**, with price, cycle, category and next renewal date,
- an **Add subscription** dialog that creates a row and refreshes the totals without a full reload.

Rendering it also emits the product's north-star metric event.

## Contract

| Direction | Contract | Where |
|---|---|---|
| Consumes | `Subscription[]` scoped to one owner | `SubscriptionRepository.list(userId)` |
| Consumes | `upcomingWindowDays`, `categories`, `billingCycles` | `getConfig().product` |
| Exposes | `DashboardSummaryResponse` | `dashboardSummarySchema` (`src/schemas/dashboard.ts`) |
| Exposes | `GET /api/v1/dashboard` → `{ success, data }` | `src/app/api/v1/dashboard/route.ts` |
| Emits | `renewals_viewed` | `northStarEventSchema` (`src/schemas/events.ts`) |

## How it is put together

`STRUCTURE.md` declares `routes / UI → domain → repositories` with **no service layer**, route
handlers kept thin and `src/domain/` kept pure. The aggregation therefore lives in a pure builder
that both callers share:

- [`src/domain/dashboard.ts`](../../src/domain/dashboard.ts) — `buildDashboardSummary()`, pure, no I/O.
  Composes the existing `calculateTotalSpend`, `filterUpcomingRenewals` and
  `calculateCategorySpendBreakdown` primitives. It performs **no authorization**; the caller must
  supply rows already scoped to one owner.
- [`src/app/dashboard/page.tsx`](../../src/app/dashboard/page.tsx) — server component: guard → repository → builder → emit event → render.
- [`src/app/api/v1/dashboard/route.ts`](../../src/app/api/v1/dashboard/route.ts) — the same chain, returning JSON.

Because both go through one builder, the page and the API cannot drift in what they compute.

### Why the API route does not emit the north-star event

The event means *a user viewed their renewals*, which happens when the page renders. The page calls
the repository directly (no self-HTTP hop, per ADR-001), so the API endpoint serves client-side
refreshes only. Emitting in both places would double-count the first load and inflate the metric on
every refresh. **One render, one event** — verified live (see below).

A `router.refresh()` after adding a subscription is a genuine re-render and does emit again. That is
harmless for the metric as defined: the north star counts **distinct users per week**, and the
reader planned in [M3-SLICE-04](../issues/M3-SLICE-04_north_star_readable_docs.md) counts distinct
`userId`, not raw event volume.

### Privacy of the event (ADR-006)

`emitRenewalsViewed()` builds the payload field-by-field and validates it against
`northStarEventSchema` **before** it reaches the logger — it never spreads a caller-supplied object.
A malformed payload is logged as an error and dropped rather than escaping half-formed. The event
carries `userId`, `timestamp`, `upcomingCount`, `windowDays` and nothing else.

## Exit criteria — and how each was verified

| Criterion | Status | Evidence |
|---|---|---|
| Totals correct across cycles | **met** | Live page HTML contains `$27.57` and `$330.88` for Netflix $15.99/mo + Amazon Prime $139/yr; unit + integration + E2E all assert the same figures |
| Renewals in next 30 days, soonest first | **met** | Integration test asserts `['Sooner','Later']`; E2E asserts `Netflix` before `Amazon Prime` in the rendered list |
| Add a subscription in under a minute | **met** | E2E fills 5 fields and the row appears; whole journey runs in 3.8s |
| Dashboard fails closed | **met** | Live `GET /dashboard` → **307** to `/login`; `GET /api/v1/dashboard` → **401**; E2E asserts the redirect |
| Tenant isolation (B sees none of A) | **met** | Integration: B's totals are 0 and A's name absent from B's payload. E2E: separate browser contexts, `Private Service A` absent from B's DOM |
| North-star event, no financial content | **met (manually)** | Live server log emitted exactly one event per render; grep for names/prices/`1599`/`13900` returned 0 matches |
| Window from config, not a literal | **met** | Unit test drives `windowDays: 7` and asserts the item falls outside |
| `/frontend-audit` 0 errors | **NOT met — blocked** | 0 errors from this feature's files; 11 pre-existing palette errors remain (see below) |

## Verification commands

```bash
pnpm test tests/unit/dashboard.test.ts          # 8 unit tests
pnpm test:integration tests/integration/dashboard.test.ts   # 4 integration tests (real Postgres)
pnpm test:e2e                                   # 3 browser journeys
```

## Known gaps

1. **The page → event wire is not pinned by a test.** A delete-the-wire check (disabling
   `emitRenewalsViewed` in the page) left all 56 tests green. The unit test covers the emitter in
   isolation; nothing asserts the page calls it. Verified live instead. The automated pin belongs to
   `tests/integration/north-star-event.test.ts`, already listed in
   [M3-SLICE-04](../issues/M3-SLICE-04_north_star_readable_docs.md).
2. **Status-token contrast fails the design system's own floor.** `--warning` reads 3.31:1 on
   `--card` and `--destructive` 3.49:1 in dark mode, against a 4.5:1 text bar. Pre-existing in
   `DESIGN.md` / `globals.css`. Mitigated here: `Badge` renders status text in `--foreground` and
   uses the status colour only for a border (a graphic, held to 3:1), so no status colour is used as
   text by this feature. The palette itself still needs fixing — filed as ADHOC-05.
3. **Category breakdown is computed but not displayed.** `buildDashboardSummary` returns
   `categoryBreakdown` because the contract declares it; rendering it is
   [M2-SLICE-02](../issues/M2-SLICE-02_category_filtering_breakdown.md)'s job.
