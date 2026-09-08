import { beforeEach, describe, expect, it } from 'vitest'
import { getConfig, resetConfigForTests } from '@/config/loader'

describe('Config Loader & Fail-Loud Startup Guards', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    resetConfigForTests()
  })

  it('loads valid configuration and proves values actually flow', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
    process.env.APP_ORIGIN = 'http://localhost:3000'
    process.env.DATABASE_URL =
      'postgres://postgres:postgres@localhost:5432/subscription_tracker_test'
    process.env.BETTER_AUTH_SECRET = 'a_very_secure_secret_with_more_than_32_characters_here'
    process.env.DB_POOL_MAX = '15'
    process.env.LOG_LEVEL = 'warn'

    const config = getConfig()

    expect(config.env).toBe('test')
    expect(config.appOrigin).toBe('http://localhost:3000')
    expect(config.database.url).toBe(process.env.DATABASE_URL)
    // Proves override flows from env over YAML default:
    expect(config.database.poolMax).toBe(15)
    expect(config.logging.level).toBe('warn')
    // Proves product.yaml defaults flow:
    expect(config.product.defaultCurrency).toBe('USD')
    expect(config.product.upcomingWindowDays).toBe(30)
  })

  it('fails loud when BETTER_AUTH_SECRET is missing', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
    process.env.APP_ORIGIN = 'http://localhost:3000'
    process.env.DATABASE_URL =
      'postgres://postgres:postgres@localhost:5432/subscription_tracker_test'
    delete process.env.BETTER_AUTH_SECRET

    expect(() => getConfig()).toThrow(/BETTER_AUTH_SECRET/)
  })

  it('fails loud when BETTER_AUTH_SECRET is too short (< 32 chars)', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
    process.env.APP_ORIGIN = 'http://localhost:3000'
    process.env.DATABASE_URL =
      'postgres://postgres:postgres@localhost:5432/subscription_tracker_test'
    process.env.BETTER_AUTH_SECRET = 'too_short_secret'

    expect(() => getConfig()).toThrow(/at least 32 characters/)
  })

  it('fails loud when BETTER_AUTH_SECRET equals a known placeholder constant', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
    process.env.APP_ORIGIN = 'http://localhost:3000'
    process.env.DATABASE_URL =
      'postgres://postgres:postgres@localhost:5432/subscription_tracker_test'
    process.env.BETTER_AUTH_SECRET = 'replace-me-with-32-plus-random-characters-abcd'

    expect(() => getConfig()).toThrow(/known example\/placeholder constant/)
  })

  it('fails loud when DATABASE_URL is missing', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
    process.env.APP_ORIGIN = 'http://localhost:3000'
    delete process.env.DATABASE_URL
    process.env.BETTER_AUTH_SECRET = 'a_very_secure_secret_with_more_than_32_characters_here'

    expect(() => getConfig()).toThrow(/DATABASE_URL/)
  })

  it('fails loud when ERROR_REPORTER=sentry but SENTRY_DSN is unset', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
    process.env.APP_ORIGIN = 'http://localhost:3000'
    process.env.DATABASE_URL =
      'postgres://postgres:postgres@localhost:5432/subscription_tracker_test'
    process.env.BETTER_AUTH_SECRET = 'a_very_secure_secret_with_more_than_32_characters_here'
    process.env.ERROR_REPORTER = 'sentry'
    delete process.env.SENTRY_DSN

    expect(() => getConfig()).toThrow(/ERROR_REPORTER=sentry requires SENTRY_DSN/)
  })
})
