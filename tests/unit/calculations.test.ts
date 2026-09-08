import { describe, expect, it } from 'vitest'
import {
  calculateCategorySpendBreakdown,
  calculateDaysUntilRenewal,
  calculateTotalSpend,
  filterUpcomingRenewals,
  formatCalendarDate,
  fromMinorUnits,
  isUpcomingRenewal,
  normalizeMonthlyMinorUnits,
  normalizeYearlyMinorUnits,
  parseCalendarDate,
  toMinorUnits,
} from '@/domain/calculations'
import type { Subscription } from '@/domain/types'

describe('Domain Calculations & Financial Arithmetic (ADR-004)', () => {
  describe('Calendar Date Parsing & Formatting', () => {
    it('parses valid calendar dates strictly in UTC', () => {
      const parsed = parseCalendarDate('2026-09-15')
      expect(parsed.getUTCFullYear()).toBe(2026)
      expect(parsed.getUTCMonth()).toBe(8) // 0-indexed September
      expect(parsed.getUTCDate()).toBe(15)
    })

    it('formats a Date back to YYYY-MM-DD correctly', () => {
      const date = new Date(Date.UTC(2026, 8, 15))
      expect(formatCalendarDate(date)).toBe('2026-09-15')
    })

    it('rejects malformed date strings', () => {
      expect(() => parseCalendarDate('15-09-2026')).toThrow(TypeError)
      expect(() => parseCalendarDate('2026/09/15')).toThrow(TypeError)
      expect(() => parseCalendarDate('invalid')).toThrow(TypeError)
    })

    it('rejects non-existent calendar dates (e.g. Feb 30)', () => {
      expect(() => parseCalendarDate('2026-02-30')).toThrow(TypeError)
    })
  })

  describe('Days Until Renewal & Upcoming Window', () => {
    const fixedNow = new Date(Date.UTC(2026, 8, 10)) // 2026-09-10

    it('returns 0 if renewal date is today', () => {
      expect(calculateDaysUntilRenewal('2026-09-10', fixedNow)).toBe(0)
      expect(isUpcomingRenewal('2026-09-10', 30, fixedNow)).toBe(true)
    })

    it('returns positive integer for future renewals', () => {
      expect(calculateDaysUntilRenewal('2026-09-15', fixedNow)).toBe(5)
      expect(isUpcomingRenewal('2026-09-15', 30, fixedNow)).toBe(true)
    })

    it('returns negative integer for past renewals and excludes from upcoming', () => {
      expect(calculateDaysUntilRenewal('2026-09-05', fixedNow)).toBe(-5)
      expect(isUpcomingRenewal('2026-09-05', 30, fixedNow)).toBe(false)
    })

    it('respects the windowDays boundary precisely', () => {
      // Exactly 30 days away: 2026-10-10
      expect(calculateDaysUntilRenewal('2026-10-10', fixedNow)).toBe(30)
      expect(isUpcomingRenewal('2026-10-10', 30, fixedNow)).toBe(true)

      // 31 days away: 2026-10-11
      expect(calculateDaysUntilRenewal('2026-10-11', fixedNow)).toBe(31)
      expect(isUpcomingRenewal('2026-10-11', 30, fixedNow)).toBe(false)
    })
  })

  describe('Total Spend Calculation across Cycles', () => {
    it('sums monthly and yearly spend accurately, ignoring cancelled subscriptions', () => {
      const subs = [
        {
          priceMinorUnits: 1500, // $15/month
          billingCycle: 'monthly' as const,
          status: 'active',
        },
        {
          priceMinorUnits: 12000, // $120/year -> $10/month
          billingCycle: 'yearly' as const,
          status: 'active',
        },
        {
          priceMinorUnits: 3000, // $30/quarter -> $10/month, $120/year
          billingCycle: 'quarterly' as const,
          status: 'active',
        },
        {
          priceMinorUnits: 9999, // Should be ignored because cancelled
          billingCycle: 'monthly' as const,
          status: 'cancelled',
        },
      ]

      const totals = calculateTotalSpend(subs)
      // Monthly: 1500 + 1000 + 1000 = 3500
      expect(totals.totalMonthlyMinorUnits).toBe(3500)
      // Yearly: (1500*12=18000) + 12000 + 12000 = 42000
      expect(totals.totalYearlyMinorUnits).toBe(42000)
    })

    it('returns 0 for empty subscription array', () => {
      const totals = calculateTotalSpend([])
      expect(totals.totalMonthlyMinorUnits).toBe(0)
      expect(totals.totalYearlyMinorUnits).toBe(0)
    })
  })

  describe('Filter Upcoming Renewals', () => {
    const fixedNow = new Date(Date.UTC(2026, 8, 1)) // 2026-09-01

    const createDummySub = (
      id: string,
      name: string,
      renewalDate: string,
      status: 'active' | 'cancelled' = 'active',
    ): Subscription => ({
      id,
      userId: 'usr_1',
      name,
      priceMinorUnits: 1000,
      currency: 'USD',
      billingCycle: 'monthly',
      category: 'Streaming',
      nextRenewalDate: renewalDate,
      status,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    })

    it('filters upcoming renewals within window and sorts soonest first', () => {
      const subs = [
        createDummySub('sub-3', 'Later', '2026-09-20'), // 19 days
        createDummySub('sub-1', 'Soonest', '2026-09-05'), // 4 days
        createDummySub('sub-2', 'Mid', '2026-09-12'), // 11 days
        createDummySub('sub-out', 'Too Far', '2026-10-15'), // > 30 days
        createDummySub('sub-cancelled', 'Cancelled', '2026-09-06', 'cancelled'),
      ]

      const upcoming = filterUpcomingRenewals(subs, 30, fixedNow)
      expect(upcoming).toHaveLength(3)
      expect(upcoming[0].name).toBe('Soonest')
      expect(upcoming[0].daysUntilRenewal).toBe(4)
      expect(upcoming[1].name).toBe('Mid')
      expect(upcoming[1].daysUntilRenewal).toBe(11)
      expect(upcoming[2].name).toBe('Later')
      expect(upcoming[2].daysUntilRenewal).toBe(19)
    })
  })

  describe('Category Spend Breakdown', () => {
    it('calculates category spend and percentage accurately', () => {
      const subs = [
        {
          priceMinorUnits: 2000, // $20 monthly
          billingCycle: 'monthly' as const,
          category: 'Streaming' as const,
          status: 'active',
        },
        {
          priceMinorUnits: 2000, // $20 monthly
          billingCycle: 'monthly' as const,
          category: 'Streaming' as const,
          status: 'active',
        },
        {
          priceMinorUnits: 6000, // $60 monthly
          billingCycle: 'monthly' as const,
          category: 'Software' as const,
          status: 'active',
        },
      ]

      // Total = 4000 (Streaming) + 6000 (Software) = 10000
      // Streaming = 40.0%
      // Software = 60.0%
      const breakdown = calculateCategorySpendBreakdown(subs)

      expect(breakdown).toHaveLength(2)
      // Sorted highest spend first
      expect(breakdown[0].category).toBe('Software')
      expect(breakdown[0].totalMonthlyMinorUnits).toBe(6000)
      expect(breakdown[0].percentage).toBe(60.0)
      expect(breakdown[0].subscriptionCount).toBe(1)

      expect(breakdown[1].category).toBe('Streaming')
      expect(breakdown[1].totalMonthlyMinorUnits).toBe(4000)
      expect(breakdown[1].percentage).toBe(40.0)
      expect(breakdown[1].subscriptionCount).toBe(2)
    })

    it('handles empty subscription lists gracefully', () => {
      const breakdown = calculateCategorySpendBreakdown([])
      expect(breakdown).toEqual([])
    })
  })

  describe('Integer Minor Units Arithmetic & Cycle Conversion', () => {
    it('converts to and from minor units preserving exact cents', () => {
      expect(toMinorUnits(19.99)).toBe(1999)
      expect(fromMinorUnits(1999)).toBe(19.99)
    })

    it('normalizes monthly minor units with integer rounding', () => {
      expect(normalizeMonthlyMinorUnits(12000, 'yearly')).toBe(1000)
      expect(normalizeYearlyMinorUnits(1000, 'monthly')).toBe(12000)
    })
  })
})
