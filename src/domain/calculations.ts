import type {
  BillingCycle,
  Category,
  CategorySpendBreakdown,
  Subscription,
  UpcomingRenewalItem,
} from './types'
import {
  fromMinorUnits,
  normalizeMonthlyMinorUnits,
  normalizeYearlyMinorUnits,
  toMinorUnits,
} from './types'

export { fromMinorUnits, normalizeMonthlyMinorUnits, normalizeYearlyMinorUnits, toMinorUnits }

/**
 * Parses an ISO-8601 calendar string (YYYY-MM-DD) into a UTC Date at midnight.
 * Guarantees timezone neutrality across different runtime locales.
 */
export function parseCalendarDate(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!match) {
    throw new TypeError(`Invalid calendar date string (expected YYYY-MM-DD): ${dateStr}`)
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new TypeError(`Calendar date does not exist on the Gregorian calendar: ${dateStr}`)
  }
  return date
}

/**
 * Formats a Date object to an ISO calendar date string (YYYY-MM-DD) using UTC values.
 */
export function formatCalendarDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Normalizes any Date (or timestamp) to UTC midnight.
 */
export function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/**
 * Calculates whole calendar days between `referenceDate` and `targetRenewalDate`.
 * If targetRenewalDate is today, returns 0.
 * If targetRenewalDate is tomorrow, returns 1.
 * If targetRenewalDate is in the past, returns a negative integer.
 */
export function calculateDaysUntilRenewal(
  targetRenewalDate: string | Date,
  referenceDate: Date = new Date(),
): number {
  const target =
    typeof targetRenewalDate === 'string'
      ? parseCalendarDate(targetRenewalDate)
      : toUtcMidnight(targetRenewalDate)
  const current = toUtcMidnight(referenceDate)

  const diffMs = target.getTime() - current.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Determines whether a renewal date falls within the upcoming window [0, windowDays].
 */
export function isUpcomingRenewal(
  renewalDateStr: string,
  windowDays = 30,
  referenceDate: Date = new Date(),
): boolean {
  const days = calculateDaysUntilRenewal(renewalDateStr, referenceDate)
  return days >= 0 && days <= windowDays
}

export interface SpendTotals {
  totalMonthlyMinorUnits: number
  totalYearlyMinorUnits: number
}

/**
 * Calculates total monthly and yearly spend normalized across all active subscriptions.
 * Excludes cancelled subscriptions.
 */
export function calculateTotalSpend(
  subscriptions: Array<{
    priceMinorUnits: number
    billingCycle: BillingCycle
    status?: string
  }>,
): SpendTotals {
  let totalMonthly = 0
  let totalYearly = 0

  for (const sub of subscriptions) {
    if (sub.status && sub.status !== 'active') {
      continue
    }
    totalMonthly += normalizeMonthlyMinorUnits(sub.priceMinorUnits, sub.billingCycle)
    totalYearly += normalizeYearlyMinorUnits(sub.priceMinorUnits, sub.billingCycle)
  }

  return {
    totalMonthlyMinorUnits: totalMonthly,
    totalYearlyMinorUnits: totalYearly,
  }
}

/**
 * Filters subscriptions for upcoming renewals within the specified window (default: 30 days).
 * Returns items sorted soonest first.
 */
export function filterUpcomingRenewals(
  subscriptions: Subscription[],
  windowDays = 30,
  referenceDate: Date = new Date(),
): UpcomingRenewalItem[] {
  const upcoming: UpcomingRenewalItem[] = []

  for (const sub of subscriptions) {
    if (sub.status !== 'active') {
      continue
    }

    const days = calculateDaysUntilRenewal(sub.nextRenewalDate, referenceDate)
    if (days >= 0 && days <= windowDays) {
      upcoming.push({
        id: sub.id,
        name: sub.name,
        priceMinorUnits: sub.priceMinorUnits,
        currency: sub.currency,
        billingCycle: sub.billingCycle,
        category: sub.category,
        renewalDate: sub.nextRenewalDate,
        daysUntilRenewal: days,
      })
    }
  }

  // Sort soonest renewal first (ascending daysUntilRenewal)
  return upcoming.sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal)
}

/**
 * Computes category-level spend breakdown for active subscriptions.
 * Percentage is rounded to 1 decimal place (e.g. 33.3).
 * Sorted by highest spend first.
 */
export function calculateCategorySpendBreakdown(
  subscriptions: Array<{
    priceMinorUnits: number
    billingCycle: BillingCycle
    category: Category
    status?: string
  }>,
): CategorySpendBreakdown[] {
  const categoryMap = new Map<Category, { totalMonthly: number; count: number }>()

  let grandTotalMonthly = 0

  for (const sub of subscriptions) {
    if (sub.status && sub.status !== 'active') {
      continue
    }

    const monthly = normalizeMonthlyMinorUnits(sub.priceMinorUnits, sub.billingCycle)
    grandTotalMonthly += monthly

    const current = categoryMap.get(sub.category) || { totalMonthly: 0, count: 0 }
    current.totalMonthly += monthly
    current.count += 1
    categoryMap.set(sub.category, current)
  }

  const breakdown: CategorySpendBreakdown[] = []

  for (const [category, data] of categoryMap.entries()) {
    const percentage =
      grandTotalMonthly > 0 ? Math.round((data.totalMonthly / grandTotalMonthly) * 1000) / 10 : 0

    breakdown.push({
      category,
      totalMonthlyMinorUnits: data.totalMonthly,
      percentage,
      subscriptionCount: data.count,
    })
  }

  // Sort descending by spend, then alphabetically by category
  return breakdown.sort((a, b) => {
    if (b.totalMonthlyMinorUnits !== a.totalMonthlyMinorUnits) {
      return b.totalMonthlyMinorUnits - a.totalMonthlyMinorUnits
    }
    return a.category.localeCompare(b.category)
  })
}
