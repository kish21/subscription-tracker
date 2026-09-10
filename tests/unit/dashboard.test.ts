import { describe, expect, it } from 'vitest'
import { buildDashboardSummary } from '@/domain/dashboard'
import type { Subscription } from '@/domain/types'
import { emitRenewalsViewed } from '@/infra/events'

/**
 * Unit coverage for the pure dashboard aggregation and the north-star emitter
 * (M1-SLICE-03). No I/O, no DB — the seam these tests guard is the arithmetic and
 * the privacy contract of the event payload.
 */

const REFERENCE = new Date('2026-09-10T00:00:00.000Z')

function sub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: overrides.id ?? 'sub-1',
    userId: overrides.userId ?? 'user-1',
    name: overrides.name ?? 'Netflix',
    priceMinorUnits: overrides.priceMinorUnits ?? 1599,
    currency: overrides.currency ?? 'USD',
    billingCycle: overrides.billingCycle ?? 'monthly',
    category: overrides.category ?? 'Streaming',
    nextRenewalDate: overrides.nextRenewalDate ?? '2026-09-20',
    status: overrides.status ?? 'active',
    idempotencyKey: overrides.idempotencyKey ?? null,
    createdAt: overrides.createdAt ?? REFERENCE,
    updatedAt: overrides.updatedAt ?? REFERENCE,
  }
}

describe('buildDashboardSummary (M1-SLICE-03)', () => {
  it('reproduces the ticket demo figures exactly: $15.99/mo + $139/yr', () => {
    const summary = buildDashboardSummary(
      [
        sub({ id: 'a', name: 'Netflix', priceMinorUnits: 1599, billingCycle: 'monthly' }),
        sub({
          id: 'b',
          name: 'Amazon Prime',
          priceMinorUnits: 13900,
          billingCycle: 'yearly',
          nextRenewalDate: '2026-09-25',
        }),
      ],
      { windowDays: 30, currency: 'USD', referenceDate: REFERENCE },
    )

    // 1599 + round(13900/12 = 1158.33) = 1599 + 1158 = 2757 minor units => $27.57
    expect(summary.totalMonthlyMinorUnits).toBe(2757)
    // (1599 * 12) + 13900 = 19188 + 13900 = 33088 minor units => $330.88
    expect(summary.totalYearlyMinorUnits).toBe(33088)
    expect(summary.activeCount).toBe(2)
  })

  it('orders upcoming renewals soonest first and bounds them by the window', () => {
    const summary = buildDashboardSummary(
      [
        sub({ id: 'far', nextRenewalDate: '2026-09-30' }), // 20 days
        sub({ id: 'soon', nextRenewalDate: '2026-09-12' }), // 2 days
        sub({ id: 'outside', nextRenewalDate: '2026-11-01' }), // beyond 30 days
      ],
      { windowDays: 30, currency: 'USD', referenceDate: REFERENCE },
    )

    expect(summary.upcomingRenewals.map((r) => r.id)).toEqual(['soon', 'far'])
    expect(summary.upcomingCount).toBe(2)
  })

  it('honours a non-default window rather than a hardcoded 30', () => {
    const summary = buildDashboardSummary([sub({ nextRenewalDate: '2026-09-25' })], {
      windowDays: 7,
      currency: 'USD',
      referenceDate: REFERENCE,
    })

    expect(summary.upcomingWindowDays).toBe(7)
    expect(summary.upcomingCount).toBe(0)
  })

  it('excludes cancelled subscriptions from totals, counts and renewals', () => {
    const summary = buildDashboardSummary(
      [
        sub({ id: 'live', priceMinorUnits: 1000, status: 'active' }),
        sub({ id: 'dead', priceMinorUnits: 9999, status: 'cancelled' }),
      ],
      { windowDays: 30, currency: 'USD', referenceDate: REFERENCE },
    )

    expect(summary.totalMonthlyMinorUnits).toBe(1000)
    expect(summary.activeCount).toBe(1)
    expect(summary.upcomingRenewals).toHaveLength(1)
  })

  it('returns a coherent empty summary for a new account', () => {
    const summary = buildDashboardSummary([], {
      windowDays: 30,
      currency: 'EUR',
      referenceDate: REFERENCE,
    })

    expect(summary.totalMonthlyMinorUnits).toBe(0)
    expect(summary.totalYearlyMinorUnits).toBe(0)
    expect(summary.upcomingCount).toBe(0)
    expect(summary.categoryBreakdown).toEqual([])
    expect(summary.currency).toBe('EUR')
  })

  it('category breakdown percentages sum to ~100 when spend exists', () => {
    const summary = buildDashboardSummary(
      [
        sub({ id: '1', category: 'Streaming', priceMinorUnits: 1000 }),
        sub({ id: '2', category: 'Software', priceMinorUnits: 3000 }),
      ],
      { windowDays: 30, currency: 'USD', referenceDate: REFERENCE },
    )

    const total = summary.categoryBreakdown.reduce((acc, c) => acc + c.percentage, 0)
    expect(total).toBeCloseTo(100, 1)
  })
})

describe('emitRenewalsViewed — north-star privacy contract (ADR-006)', () => {
  it('emits only counts and identity, never financial or subscription content', () => {
    const event = emitRenewalsViewed({
      userId: 'user-123',
      upcomingCount: 2,
      windowDays: 30,
      occurredAt: REFERENCE,
    })

    expect(event).not.toBeNull()
    expect(event).toEqual({
      event: 'renewals_viewed',
      userId: 'user-123',
      timestamp: REFERENCE.toISOString(),
      upcomingCount: 2,
      windowDays: 30,
    })

    // The payload must carry no subscription-identifying or financial keys at all.
    const serialized = JSON.stringify(event)
    expect(serialized).not.toMatch(/price|name|category|email|MinorUnits/i)
  })

  it('drops a malformed event instead of emitting a half-formed record', () => {
    const event = emitRenewalsViewed({
      userId: '',
      upcomingCount: 1,
      windowDays: 30,
      occurredAt: REFERENCE,
    })

    expect(event).toBeNull()
  })
})
