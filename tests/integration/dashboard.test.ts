import { eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

try {
  process.loadEnvFile?.('.env')
} catch {
  // Ignore if .env is missing (CI injects env vars directly) or already loaded
}

import { GET } from '@/app/api/v1/dashboard/route'
import { auth } from '@/auth/server'
import { closeDbPool, getDb } from '@/db/client'
import { subscriptionRepository } from '@/db/repositories/subscription'
import * as schema from '@/db/schema'
import type { AllowedCurrency } from '@/domain/types'

/**
 * Integration coverage for GET /api/v1/dashboard (M1-SLICE-03), against a real
 * Postgres. The load-bearing case is tenant isolation: User B must never see a
 * single minor unit of User A's spend.
 */
describe('Dashboard API Integration Tests (M1-SLICE-03)', () => {
  const db = getDb()

  const cleanDb = async () => {
    await db.delete(schema.subscriptions)
    await db.delete(schema.session)
    await db.delete(schema.account)
    await db.delete(schema.user)
  }

  beforeAll(async () => {
    await cleanDb()
  })

  afterEach(async () => {
    await cleanDb()
  })

  afterAll(async () => {
    await cleanDb()
    await closeDbPool()
  })

  async function registerUser(
    email: string,
    name = 'Test User',
    currency: AllowedCurrency = 'USD',
  ) {
    const res = await auth.api.signUpEmail({
      body: { name, email, password: 'Password12345!', currency },
      asResponse: true,
    })

    const cookieHeader = res.headers.get('set-cookie') || ''
    const [userRow] = await db.select().from(schema.user).where(eq(schema.user.email, email))

    return {
      userId: userRow.id,
      currency: userRow.currency as AllowedCurrency,
      cookie: cookieHeader,
    }
  }

  function dashboardRequest(cookie?: string) {
    return new NextRequest('http://localhost:3000/api/v1/dashboard', {
      method: 'GET',
      headers: cookie ? { cookie } : {},
    })
  }

  it('fails closed with 401 when unauthenticated', async () => {
    const res = await GET(dashboardRequest())
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
    // No data leaks through the failure envelope.
    expect(body.data).toBeUndefined()
  })

  it('returns the ticket demo figures for a real account', async () => {
    const user = await registerUser('demo@test.com', 'Demo', 'USD')

    await subscriptionRepository.create(
      user.userId,
      {
        name: 'Netflix',
        priceMinorUnits: 1599,
        billingCycle: 'monthly',
        category: 'Streaming',
        nextRenewalDate: '2099-01-15',
      },
      user.currency,
    )
    await subscriptionRepository.create(
      user.userId,
      {
        name: 'Amazon Prime',
        priceMinorUnits: 13900,
        billingCycle: 'yearly',
        category: 'Streaming',
        nextRenewalDate: '2099-02-20',
      },
      user.currency,
    )

    const res = await GET(dashboardRequest(user.cookie))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.totalMonthlyMinorUnits).toBe(2757) // $27.57
    expect(body.data.totalYearlyMinorUnits).toBe(33088) // $330.88
    expect(body.data.activeCount).toBe(2)
    expect(body.data.currency).toBe('USD')
  })

  it('isolates tenants: User B sees none of User A spend (ADR-005)', async () => {
    const userA = await registerUser('dash-a@test.com', 'User A', 'USD')
    const userB = await registerUser('dash-b@test.com', 'User B', 'USD')

    await subscriptionRepository.create(
      userA.userId,
      {
        name: 'Private Service',
        priceMinorUnits: 5000,
        billingCycle: 'monthly',
        category: 'Software',
        nextRenewalDate: '2099-03-01',
      },
      userA.currency,
    )

    const resB = await GET(dashboardRequest(userB.cookie))
    const bodyB = await resB.json()

    expect(resB.status).toBe(200)
    expect(bodyB.data.totalMonthlyMinorUnits).toBe(0)
    expect(bodyB.data.activeCount).toBe(0)
    expect(bodyB.data.upcomingRenewals).toEqual([])
    // User A's subscription name must not appear anywhere in User B's payload.
    expect(JSON.stringify(bodyB)).not.toContain('Private Service')

    const resA = await GET(dashboardRequest(userA.cookie))
    const bodyA = await resA.json()
    expect(bodyA.data.totalMonthlyMinorUnits).toBe(5000)
  })

  it('surfaces upcoming renewals soonest first, bounded by the configured window', async () => {
    const user = await registerUser('renewals@test.com', 'Renewals', 'USD')

    const today = new Date()
    const inDays = (n: number) => {
      const d = new Date(today)
      d.setUTCDate(d.getUTCDate() + n)
      return d.toISOString().slice(0, 10)
    }

    await subscriptionRepository.create(
      user.userId,
      {
        name: 'Later',
        priceMinorUnits: 1000,
        billingCycle: 'monthly',
        category: 'Software',
        nextRenewalDate: inDays(20),
      },
      user.currency,
    )
    await subscriptionRepository.create(
      user.userId,
      {
        name: 'Sooner',
        priceMinorUnits: 2000,
        billingCycle: 'monthly',
        category: 'Software',
        nextRenewalDate: inDays(3),
      },
      user.currency,
    )
    await subscriptionRepository.create(
      user.userId,
      {
        name: 'Outside window',
        priceMinorUnits: 3000,
        billingCycle: 'monthly',
        category: 'Software',
        nextRenewalDate: inDays(200),
      },
      user.currency,
    )

    const res = await GET(dashboardRequest(user.cookie))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.upcomingRenewals.map((r: { name: string }) => r.name)).toEqual([
      'Sooner',
      'Later',
    ])
    expect(body.data.upcomingCount).toBe(2)
  })
})
