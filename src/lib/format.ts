/**
 * Presentation-only formatting helpers.
 *
 * Deliberately generic: these know about money and dates, never about
 * subscriptions. Business rules live in `src/domain/` (STRUCTURE.md).
 */

import { fromMinorUnits } from '@/domain/types'

/**
 * Formats integer minor units as a localised currency string.
 *
 * Rounding is applied ONCE, here at display (ADR-004) — the arithmetic upstream
 * stays in integer minor units the whole way.
 */
export function formatMoney(minorUnits: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fromMinorUnits(minorUnits))
}

/**
 * Renders an ISO-8601 calendar string (YYYY-MM-DD) as a human date.
 * Parsed as UTC so the displayed day never shifts with the viewer's timezone.
 */
export function formatCalendarDateLabel(isoDate: string, locale?: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/** Turns a day count into the short relative label used on renewal badges. */
export function formatDaysUntil(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `in ${days} days`
}
