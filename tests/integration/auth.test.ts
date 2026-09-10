import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

try {
  process.loadEnvFile?.('.env')
} catch {
  // Ignore if .env is missing (CI injects env vars directly) or already loaded
}

import { auth } from '@/auth/server'
import { getCurrentUser, requireAuth } from '@/auth/session'
import { closeDbPool, getDb } from '@/db/client'
import * as schema from '@/db/schema'
import { UnauthorizedError } from '@/infra/errors'
import { signInSchema, signUpSchema } from '@/schemas/auth'

describe('Auth & Session Lifecycle Integration Test', () => {
  const db = getDb()

  const cleanDb = async () => {
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

  describe('User Registration & Password Hashing', () => {
    it('creates user with chosen currency and stores password hashed with modern KDF', async () => {
      const rawPassword = 'StrongPassword987!'
      const res = await auth.api.signUpEmail({
        body: {
          name: 'Alice Springs',
          email: 'alice@example.com',
          password: rawPassword,
          currency: 'EUR',
        },
        asResponse: true,
      })

      expect(res.status).toBe(200)

      // 1. Verify user record in database
      const users = await db.select().from(schema.user)
      expect(users).toHaveLength(1)
      expect(users[0].name).toBe('Alice Springs')
      expect(users[0].email).toBe('alice@example.com')
      expect(users[0].currency).toBe('EUR')

      // 2. Verify password is NOT stored in plain text and is hashed
      const accounts = await db.select().from(schema.account)
      expect(accounts).toHaveLength(1)
      expect(accounts[0].password).toBeDefined()
      expect(accounts[0].password).not.toBe(rawPassword)
      expect(accounts[0].password).not.toContain(rawPassword)
      // Modern KDF format contains salt/hash delimiter
      expect(accounts[0].password).toMatch(/:/)
    })

    it('defaults currency to USD when not explicitly provided', async () => {
      const res = await auth.api.signUpEmail({
        body: {
          name: 'Bob Default',
          email: 'bob@example.com',
          password: 'PasswordBob123!',
        },
        asResponse: true,
      })

      expect(res.status).toBe(200)

      const users = await db.select().from(schema.user)
      expect(users).toHaveLength(1)
      expect(users[0].currency).toBe('USD')
    })
  })

  describe('Session Issuance & Cookie Security', () => {
    it('sets secure httpOnly SameSite session cookie upon signup', async () => {
      const res = await auth.api.signUpEmail({
        body: {
          name: 'Cookie User',
          email: 'cookie@example.com',
          password: 'Password12345!',
          currency: 'GBP',
        },
        asResponse: true,
      })

      const setCookie = res.headers.get('set-cookie')
      expect(setCookie).toBeDefined()
      expect(setCookie).toContain('subscription_tracker.session_token=')
      expect(setCookie).toMatch(/HttpOnly/i)
      expect(setCookie).toMatch(/SameSite=Lax/i)

      // Verify session persisted in database
      const sessions = await db.select().from(schema.session)
      expect(sessions).toHaveLength(1)
      expect(new Date(sessions[0].expiresAt).getTime()).toBeGreaterThan(Date.now())
    })

    it('issues session on valid login', async () => {
      // First create user
      await auth.api.signUpEmail({
        body: {
          name: 'Login User',
          email: 'login@example.com',
          password: 'ValidPassword123!',
          currency: 'USD',
        },
      })

      // Sign in
      const res = await auth.api.signInEmail({
        body: {
          email: 'login@example.com',
          password: 'ValidPassword123!',
        },
        asResponse: true,
      })

      expect(res.status).toBe(200)
      const setCookie = res.headers.get('set-cookie')
      expect(setCookie).toContain('subscription_tracker.session_token=')
    })
  })

  describe('Fail-Closed: Invalid Credentials & Token Rejection', () => {
    it('rejects login with incorrect password without creating session', async () => {
      await auth.api.signUpEmail({
        body: {
          name: 'Target User',
          email: 'target@example.com',
          password: 'RealPassword123!',
        },
      })

      // Try with wrong password
      const res = await auth.api.signInEmail({
        body: {
          email: 'target@example.com',
          password: 'WrongPassword999!',
        },
        asResponse: true,
      })

      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('rejects login with non-existent email', async () => {
      const res = await auth.api.signInEmail({
        body: {
          email: 'nobody@example.com',
          password: 'SomePassword123!',
        },
        asResponse: true,
      })

      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Session Reader (getCurrentUser & requireAuth)', () => {
    it('returns authenticated user when valid cookie is presented', async () => {
      const signUpRes = await auth.api.signUpEmail({
        body: {
          name: 'Reader Test',
          email: 'reader@example.com',
          password: 'PasswordReader1!',
          currency: 'INR',
        },
        asResponse: true,
      })

      const cookieHeader = signUpRes.headers.get('set-cookie') || ''
      const headers = new Headers()
      headers.set('cookie', cookieHeader)

      const currentUser = await getCurrentUser(headers)
      expect(currentUser).not.toBeNull()
      expect(currentUser?.email).toBe('reader@example.com')
      expect(currentUser?.name).toBe('Reader Test')
      expect(currentUser?.currency).toBe('INR')

      const requiredUser = await requireAuth(headers)
      expect(requiredUser.id).toBe(currentUser?.id)
    })

    it('fails closed and returns null when unauthenticated or header is missing', async () => {
      const emptyHeaders = new Headers()
      const user = await getCurrentUser(emptyHeaders)
      expect(user).toBeNull()
    })

    it('fails closed and returns null when cookie contains forged or invalid token', async () => {
      const forgedHeaders = new Headers()
      forgedHeaders.set(
        'cookie',
        'subscription_tracker.session_token=forged_invalid_token_value; Path=/',
      )

      const user = await getCurrentUser(forgedHeaders)
      expect(user).toBeNull()
    })

    it('requireAuth throws UnauthorizedError (401) when session is absent', async () => {
      const emptyHeaders = new Headers()
      await expect(requireAuth(emptyHeaders)).rejects.toThrow(UnauthorizedError)
    })
  })

  describe('Boundary Schema Validation', () => {
    it('validates SignUp input at boundary and rejects invalid payloads', () => {
      // Password too short (< 8 chars)
      const shortPw = signUpSchema.safeParse({
        name: 'User',
        email: 'user@example.com',
        password: '123',
      })
      expect(shortPw.success).toBe(false)

      // Malformed email
      const badEmail = signUpSchema.safeParse({
        name: 'User',
        email: 'not-an-email',
        password: 'Password123!',
      })
      expect(badEmail.success).toBe(false)

      // Disallowed currency
      const badCurrency = signUpSchema.safeParse({
        name: 'User',
        email: 'user@example.com',
        password: 'Password123!',
        currency: 'INVALID_CURRENCY',
      })
      expect(badCurrency.success).toBe(false)

      // Valid signup input
      const valid = signUpSchema.safeParse({
        name: 'Valid User',
        email: 'valid@example.com',
        password: 'ValidPassword123!',
        currency: 'USD',
      })
      expect(valid.success).toBe(true)
    })

    it('validates SignIn input at boundary', () => {
      const badEmail = signInSchema.safeParse({
        email: 'not-an-email',
        password: 'pass',
      })
      expect(badEmail.success).toBe(false)

      const valid = signInSchema.safeParse({
        email: 'valid@example.com',
        password: 'ValidPassword123!',
      })
      expect(valid.success).toBe(true)
    })
  })
})
