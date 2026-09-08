import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getConfig } from '@/config/loader'
import { getDb } from '@/db/client'
import * as schema from '@/db/schema'

const config = getConfig()

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: config.auth.secret,
  baseURL: config.appOrigin,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      currency: {
        type: 'string',
        required: false,
        defaultValue: config.product.defaultCurrency,
        input: true,
      },
    },
  },
  session: {
    expiresIn: config.auth.sessionTtlDays * 24 * 60 * 60,
    updateAge: config.auth.sessionRefreshEveryDays * 24 * 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  rateLimit: {
    enabled: config.auth.rateLimit.enabled,
    window: config.auth.rateLimit.windowSeconds,
    max: config.auth.rateLimit.loginMaxAttempts,
  },
  advanced: {
    cookiePrefix: 'subscription_tracker',
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProduction,
    },
  },
})

export type Auth = typeof auth
