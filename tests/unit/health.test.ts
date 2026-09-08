import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/health/route'
import * as dbClient from '@/db/client'

vi.mock('@/db/client', () => ({
  checkDbConnection: vi.fn(),
}))

describe('GET /api/health Endpoint', () => {
  beforeEach(() => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
    process.env.APP_ORIGIN = 'http://localhost:3000'
    process.env.DATABASE_URL =
      'postgres://postgres:postgres@localhost:5432/subscription_tracker_test'
    process.env.BETTER_AUTH_SECRET = 'a_very_secure_secret_with_more_than_32_characters_here'
  })

  it('returns HTTP 200 with status=healthy when database connects', async () => {
    vi.mocked(dbClient.checkDbConnection).mockResolvedValueOnce({
      ok: true,
      latencyMs: 12,
    })

    const response = await GET()
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.status).toBe('healthy')
    expect(data.version).toBe('0.1.0')
    expect(data.database.connected).toBe(true)
    expect(data.database.latencyMs).toBe(12)
    expect(data.timestamp).toBeDefined()
  })

  it('returns HTTP 503 with status=degraded when database is unreachable', async () => {
    vi.mocked(dbClient.checkDbConnection).mockResolvedValueOnce({
      ok: false,
      latencyMs: 50,
      error: 'ECONNREFUSED 127.0.0.1:5432',
    })

    const response = await GET()
    expect(response.status).toBe(503)

    const data = await response.json()
    expect(data.status).toBe('degraded')
    expect(data.database.connected).toBe(false)
    expect(data.database.error).toBe('ECONNREFUSED 127.0.0.1:5432')
  })
})
