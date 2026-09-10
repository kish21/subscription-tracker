import { NextRequest } from 'next/server'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

try {
  process.loadEnvFile?.('.env')
} catch {
  // Ignore if .env is missing (CI injects env vars directly) or already loaded
}

import { eq } from 'drizzle-orm'
import { GET, POST } from '@/app/api/v1/subscriptions/route'
import { auth } from '@/auth/server'
import { closeDbPool, getDb } from '@/db/client'
import { subscriptionRepository } from '@/db/repositories/subscription'
import * as schema from '@/db/schema'
import type { AllowedCurrency } from '@/domain/types'

describe('Subscription Domain & Storage Seam Integration Tests (M1-SLICE-02)', () => {
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

  // Helper to register a user and get session cookie
  async function registerUser(
    email: string,
    name = 'Test User',
    currency: AllowedCurrency = 'USD',
  ) {
    const res = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password: 'Password12345!',
        currency,
      },
      asResponse: true,
    })

    const cookieHeader = res.headers.get('set-cookie') || ''
    const [userRow] = await db.select().from(schema.user).where(eq(schema.user.email, email))

    return {
      userId: userRow.id,
      email: userRow.email,
      currency: userRow.currency as AllowedCurrency,
      cookie: cookieHeader,
    }
  }

  describe('Repository: Tenant Isolation & CRUD (ADR-005)', () => {
    it('creates and retrieves a subscription for a tenant', async () => {
      const user = await registerUser('alice@test.com', 'Alice', 'EUR')

      const created = await subscriptionRepository.create(
        user.userId,
        {
          name: 'Spotify Premium',
          priceMinorUnits: 1099,
          billingCycle: 'monthly',
          category: 'Music & Audio',
          nextRenewalDate: '2026-10-01',
        },
        user.currency,
      )

      expect(created.id).toBeDefined()
      expect(created.userId).toBe(user.userId)
      expect(created.name).toBe('Spotify Premium')
      expect(created.priceMinorUnits).toBe(1099)
      expect(created.currency).toBe('EUR')
      expect(created.billingCycle).toBe('monthly')
      expect(created.category).toBe('Music & Audio')
      expect(created.nextRenewalDate).toBe('2026-10-01')
      expect(created.status).toBe('active')

      const fetched = await subscriptionRepository.findById(user.userId, created.id)
      expect(fetched).not.toBeNull()
      expect(fetched?.name).toBe('Spotify Premium')
    })

    it('enforces strict tenant isolation: User B cannot find, list, update, or delete User A records', async () => {
      const userA = await registerUser('usera@test.com', 'User A', 'USD')
      const userB = await registerUser('userb@test.com', 'User B', 'USD')

      // User A creates a subscription
      const subA = await subscriptionRepository.create(
        userA.userId,
        {
          name: 'Private Secret Service',
          priceMinorUnits: 5000,
          billingCycle: 'yearly',
          category: 'Software',
          nextRenewalDate: '2026-11-15',
        },
        userA.currency,
      )

      // 1. User B cannot find User A subscription by ID
      const findAttempt = await subscriptionRepository.findById(userB.userId, subA.id)
      expect(findAttempt).toBeNull()

      // 2. User B listing returns 0 items
      const listUserB = await subscriptionRepository.list(userB.userId)
      expect(listUserB.totalCount).toBe(0)
      expect(listUserB.items).toHaveLength(0)

      // 3. User B cannot update User A subscription
      const updateAttempt = await subscriptionRepository.update(userB.userId, subA.id, {
        name: 'Hacked Subscription',
      })
      expect(updateAttempt).toBeNull()

      // Confirm User A's row was NOT modified
      const subAVerified = await subscriptionRepository.findById(userA.userId, subA.id)
      expect(subAVerified?.name).toBe('Private Secret Service')

      // 4. User B cannot delete User A subscription
      const deleteAttempt = await subscriptionRepository.delete(userB.userId, subA.id)
      expect(deleteAttempt).toBe(false)

      // Confirm User A's row still exists
      const subAStillExists = await subscriptionRepository.findById(userA.userId, subA.id)
      expect(subAStillExists).not.toBeNull()
    })

    it('enforces idempotency key handling: duplicate keys return existing subscription', async () => {
      const user = await registerUser('idemp@test.com', 'Idempotent User', 'USD')
      const idempotencyKey = 'req-unique-token-abc-123'

      const sub1 = await subscriptionRepository.create(
        user.userId,
        {
          name: 'Netflix 4K',
          priceMinorUnits: 2299,
          billingCycle: 'monthly',
          category: 'Streaming',
          nextRenewalDate: '2026-10-05',
          idempotencyKey,
        },
        user.currency,
      )

      // Second identical call with the same idempotencyKey
      const sub2 = await subscriptionRepository.create(
        user.userId,
        {
          name: 'Netflix 4K',
          priceMinorUnits: 2299,
          billingCycle: 'monthly',
          category: 'Streaming',
          nextRenewalDate: '2026-10-05',
          idempotencyKey,
        },
        user.currency,
      )

      expect(sub2.id).toBe(sub1.id)
      expect(sub2.name).toBe(sub1.name)

      // Verify database table holds exactly ONE row
      const list = await subscriptionRepository.list(user.userId)
      expect(list.totalCount).toBe(1)
    })

    it('handles concurrent identical creation requests gracefully without throwing 23505 [ADHOC-03]', async () => {
      const user = await registerUser('concurrent@test.com', 'Concurrent User', 'USD')
      const idempotencyKey = 'concurrent-race-token-xyz'

      const input = {
        name: 'Concurrent Sub',
        priceMinorUnits: 1299,
        billingCycle: 'monthly' as const,
        category: 'Software' as const,
        nextRenewalDate: '2026-10-15',
        idempotencyKey,
      }

      // Execute both simultaneously
      const [res1, res2] = await Promise.all([
        subscriptionRepository.create(user.userId, input, user.currency),
        subscriptionRepository.create(user.userId, input, user.currency),
      ])

      expect(res1.id).toBe(res2.id)
      expect(res1.name).toBe('Concurrent Sub')

      const list = await subscriptionRepository.list(user.userId)
      expect(list.totalCount).toBe(1)
    })

    it('escapes SQL LIKE wildcards (%, _, \\) in search query [ADHOC-04]', async () => {
      const user = await registerUser('wildcards@test.com', 'Wildcard User', 'USD')

      await subscriptionRepository.create(
        user.userId,
        {
          name: '100% Cotton Box',
          priceMinorUnits: 3000,
          billingCycle: 'monthly',
          category: 'Other',
          nextRenewalDate: '2026-10-01',
        },
        user.currency,
      )

      await subscriptionRepository.create(
        user.userId,
        {
          name: '1000 Subscribers Plan',
          priceMinorUnits: 5000,
          billingCycle: 'monthly',
          category: 'Software',
          nextRenewalDate: '2026-10-02',
        },
        user.currency,
      )

      await subscriptionRepository.create(
        user.userId,
        {
          name: 'dev_tools_pro',
          priceMinorUnits: 1500,
          billingCycle: 'monthly',
          category: 'Software',
          nextRenewalDate: '2026-10-03',
        },
        user.currency,
      )

      // Search for literal '100%' should only return '100% Cotton Box', not '1000 Subscribers Plan'
      const percentSearch = await subscriptionRepository.list(user.userId, { search: '100%' })
      expect(percentSearch.totalCount).toBe(1)
      expect(percentSearch.items[0].name).toBe('100% Cotton Box')

      // Search for literal '_' should only return 'dev_tools_pro'
      const underscoreSearch = await subscriptionRepository.list(user.userId, { search: '_' })
      expect(underscoreSearch.totalCount).toBe(1)
      expect(underscoreSearch.items[0].name).toBe('dev_tools_pro')
    })

    it('filters subscriptions by category, status, and search query', async () => {
      const user = await registerUser('filters@test.com', 'Filter User', 'USD')

      await subscriptionRepository.create(
        user.userId,
        {
          name: 'Netflix',
          priceMinorUnits: 1500,
          billingCycle: 'monthly',
          category: 'Streaming',
          nextRenewalDate: '2026-10-01',
        },
        user.currency,
      )

      await subscriptionRepository.create(
        user.userId,
        {
          name: 'Disney+',
          priceMinorUnits: 999,
          billingCycle: 'monthly',
          category: 'Streaming',
          nextRenewalDate: '2026-10-02',
        },
        user.currency,
      )

      const github = await subscriptionRepository.create(
        user.userId,
        {
          name: 'GitHub Copilot',
          priceMinorUnits: 1000,
          billingCycle: 'monthly',
          category: 'Software',
          nextRenewalDate: '2026-10-03',
        },
        user.currency,
      )

      // Filter by category: Streaming
      const streamingList = await subscriptionRepository.list(user.userId, {
        category: 'Streaming',
      })
      expect(streamingList.totalCount).toBe(2)

      // Search by name: 'github'
      const searchList = await subscriptionRepository.list(user.userId, {
        search: 'github',
      })
      expect(searchList.totalCount).toBe(1)
      expect(searchList.items[0].name).toBe('GitHub Copilot')

      // Mark github cancelled and filter by active
      await subscriptionRepository.update(user.userId, github.id, {
        status: 'cancelled',
      })
      const activeList = await subscriptionRepository.list(user.userId, {
        status: 'active',
      })
      expect(activeList.totalCount).toBe(2)
    })
  })

  describe('REST API Route Handlers: /api/v1/subscriptions', () => {
    it('POST creates subscription for authenticated user and returns 201', async () => {
      const user = await registerUser('apiuser@test.com', 'Api User', 'GBP')

      const req = new NextRequest('http://localhost:3000/api/v1/subscriptions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: user.cookie,
        },
        body: JSON.stringify({
          name: 'Claude Pro',
          priceMinorUnits: 2000,
          billingCycle: 'monthly',
          category: 'Software',
          nextRenewalDate: '2026-10-10',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.name).toBe('Claude Pro')
      expect(body.data.priceMinorUnits).toBe(2000)
      expect(body.data.currency).toBe('GBP') // Inherited from user currency
      expect(body.data.billingCycle).toBe('monthly')
    })

    it('POST rejects unauthenticated request with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/subscriptions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Unauthorized Sub',
          priceMinorUnits: 1000,
          billingCycle: 'monthly',
          category: 'Streaming',
          nextRenewalDate: '2026-10-10',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('POST rejects invalid payload (e.g. float money, bad date) with 400', async () => {
      const user = await registerUser('badpayload@test.com', 'Bad User')

      // Float price violates ADR-004
      const reqFloat = new NextRequest('http://localhost:3000/api/v1/subscriptions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: user.cookie,
        },
        body: JSON.stringify({
          name: 'Invalid Price',
          priceMinorUnits: 19.99, // FORBIDDEN: float instead of integer cents
          billingCycle: 'monthly',
          category: 'Streaming',
          nextRenewalDate: '2026-10-10',
        }),
      })

      const resFloat = await POST(reqFloat)
      expect(resFloat.status).toBe(400)

      // Malformed date
      const reqDate = new NextRequest('http://localhost:3000/api/v1/subscriptions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: user.cookie,
        },
        body: JSON.stringify({
          name: 'Bad Date',
          priceMinorUnits: 1999,
          billingCycle: 'monthly',
          category: 'Streaming',
          nextRenewalDate: '10/10/2026', // FORBIDDEN: not YYYY-MM-DD
        }),
      })

      const resDate = await POST(reqDate)
      expect(resDate.status).toBe(400)
    })

    it('GET returns subscription list for authenticated user', async () => {
      const user = await registerUser('getuser@test.com', 'Get User')

      // Create two subscriptions via repository
      await subscriptionRepository.create(
        user.userId,
        {
          name: 'Sub 1',
          priceMinorUnits: 500,
          billingCycle: 'monthly',
          category: 'Utilities',
          nextRenewalDate: '2026-09-30',
        },
        user.currency,
      )
      await subscriptionRepository.create(
        user.userId,
        {
          name: 'Sub 2',
          priceMinorUnits: 1500,
          billingCycle: 'monthly',
          category: 'Utilities',
          nextRenewalDate: '2026-10-15',
        },
        user.currency,
      )

      const req = new NextRequest('http://localhost:3000/api/v1/subscriptions', {
        method: 'GET',
        headers: {
          cookie: user.cookie,
        },
      })

      const res = await GET(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.totalCount).toBe(2)
      expect(body.data.items).toHaveLength(2)
    })

    it('GET fails closed and returns 401 when unauthenticated', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/subscriptions', {
        method: 'GET',
      })

      const res = await GET(req)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.success).toBe(false)
    })

    it('Adversarial cross-tenant check: User B sees 0 subscriptions when User A has subscriptions', async () => {
      const userA = await registerUser('targeta@test.com', 'Target A')
      const userB = await registerUser('attackerb@test.com', 'Attacker B')

      // User A creates a subscription
      await subscriptionRepository.create(
        userA.userId,
        {
          name: 'Secret Company Subscription',
          priceMinorUnits: 99900,
          billingCycle: 'yearly',
          category: 'Cloud & Hosting',
          nextRenewalDate: '2026-12-01',
        },
        userA.currency,
      )

      // User B sends GET request with User B session cookie
      const reqB = new NextRequest('http://localhost:3000/api/v1/subscriptions', {
        method: 'GET',
        headers: {
          cookie: userB.cookie,
        },
      })

      const resB = await GET(reqB)
      expect(resB.status).toBe(200)

      const bodyB = await resB.json()
      expect(bodyB.success).toBe(true)
      expect(bodyB.data.totalCount).toBe(0)
      expect(bodyB.data.items).toHaveLength(0)
    })
  })
})
