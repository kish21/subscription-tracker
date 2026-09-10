/**
 * Dashboard aggregation — pure business rules, no I/O (STRUCTURE.md: `src/domain/`).
 *
 * Composes the existing calculation primitives into the single shape the dashboard
 * contract promises (`dashboardSummarySchema`). Both callers — the server-rendered
 * page and `GET /api/v1/dashboard` — share this function, so the page and the API
 * can never drift apart in what they compute.
 */

import type { DashboardSummaryResponse } from '@/schemas/dashboard'
import {
  calculateCategorySpendBreakdown,
  calculateTotalSpend,
  filterUpcomingRenewals,
} from './calculations'
import type { AllowedCurrency, Subscription } from './types'

export interface DashboardSummaryOptions {
  /** Upcoming-renewals window, in days. Supplied from config — never a literal. */
  windowDays: number
  /** The account currency every subscription inherits. */
  currency: AllowedCurrency
  /** Injected for determinism; production passes the system clock's `now()`. */
  referenceDate: Date
}

/**
 * Builds the complete dashboard summary from a tenant's subscription rows.
 *
 * The caller is responsible for having scoped `subscriptions` to one owner
 * (ADR-005) — this function performs no authorization of its own.
 */
export function buildDashboardSummary(
  subscriptions: Subscription[],
  options: DashboardSummaryOptions,
): DashboardSummaryResponse {
  const { windowDays, currency, referenceDate } = options

  const totals = calculateTotalSpend(subscriptions)
  const upcomingRenewals = filterUpcomingRenewals(subscriptions, windowDays, referenceDate)
  const categoryBreakdown = calculateCategorySpendBreakdown(subscriptions)
  const activeCount = subscriptions.filter((s) => s.status === 'active').length

  return {
    totalMonthlyMinorUnits: totals.totalMonthlyMinorUnits,
    totalYearlyMinorUnits: totals.totalYearlyMinorUnits,
    currency,
    activeCount,
    upcomingCount: upcomingRenewals.length,
    upcomingWindowDays: windowDays,
    upcomingRenewals,
    categoryBreakdown,
  }
}
