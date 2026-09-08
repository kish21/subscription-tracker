/**
 * Typed config loader — the single place the app learns anything about its environment.
 *
 * Three layers, lowest priority first:
 *   1. `platform.yaml`  — engine/technical defaults (timeouts, pool, log level)
 *   2. `product.yaml`   — product/business knobs (categories, currencies, windows)
 *   3. `.env`           — secrets, and per-environment overrides of any knob above
 *
 * Two rules this file exists to enforce:
 *   - NO HARDCODING. Nothing else in `src/` reads `process.env` directly. If a value
 *     can differ between dev and prod, it arrives through here.
 *   - FAIL LOUD AT BOOT. A missing or malformed value aborts startup with a readable
 *     message, rather than silently defaulting and misbehaving in production.
 *
 * Server-only. Never import this from a client component — it reads secrets.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parse as parseYaml } from 'yaml'
import { z } from 'zod'

const CONFIG_DIR = join(process.cwd(), 'src', 'config')

/* ------------------------------------------------------------------ *
 * Layer 1 + 2 — YAML shapes
 * ------------------------------------------------------------------ */

const platformSchema = z.object({
  database: z.object({
    pool_max: z.number().int().positive(),
    connect_timeout_ms: z.number().int().positive(),
    statement_timeout_ms: z.number().int().positive(),
    connect_retries: z.number().int().min(0),
    connect_retry_backoff_ms: z.number().int().min(0),
  }),
  session: z.object({
    ttl_days: z.number().int().positive(),
    refresh_every_days: z.number().int().positive(),
  }),
  rate_limit: z.object({
    enabled: z.boolean(),
    window_seconds: z.number().int().positive(),
    signup_max_attempts: z.number().int().positive(),
    login_max_attempts: z.number().int().positive(),
  }),
  logging: z.object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
    pretty: z.boolean(),
  }),
  error_reporter: z.object({
    provider: z.enum(['noop', 'sentry']),
    send_timeout_ms: z.number().int().positive(),
  }),
})

const billingCycleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  months: z.number().int().positive(),
})

const productSchema = z.object({
  renewals: z.object({
    upcoming_window_days: z.number().int().positive(),
  }),
  currency: z.object({
    default: z.string().length(3),
    allowed: z.array(z.string().length(3)).min(1),
  }),
  categories: z.array(z.string().min(1)).min(1),
  limits: z.object({
    max_subscriptions_per_account: z.number().int().positive(),
    max_name_length: z.number().int().positive(),
    max_price_major_units: z.number().int().positive(),
  }),
  billing_cycles: z.array(billingCycleSchema).min(1),
})

/* ------------------------------------------------------------------ *
 * Layer 3 — environment
 *
 * Secrets are REQUIRED and have no default: the app must refuse to start
 * rather than run on a guessed credential. Overrides are optional.
 * ------------------------------------------------------------------ */

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ORIGIN: z.string().url(),

  // --- secrets (required, never defaulted) ---
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  SENTRY_DSN: z.string().optional(),

  // --- optional overrides of platform.yaml ---
  DB_POOL_MAX: z.coerce.number().int().positive().optional(),
  DB_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  DB_CONNECT_RETRIES: z.coerce.number().int().min(0).optional(),
  DB_CONNECT_RETRY_BACKOFF_MS: z.coerce.number().int().min(0).optional(),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().optional(),
  SESSION_REFRESH_EVERY_DAYS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_ENABLED: z.enum(['true', 'false']).optional(),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_SIGNUP_MAX: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().positive().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),
  LOG_PRETTY: z.enum(['true', 'false']).optional(),
  ERROR_REPORTER: z.enum(['noop', 'sentry']).optional(),
  ERROR_REPORTER_TIMEOUT_MS: z.coerce.number().int().positive().optional(),

  // --- optional overrides of product.yaml ---
  RENEWALS_UPCOMING_WINDOW_DAYS: z.coerce.number().int().positive().optional(),
  DEFAULT_CURRENCY: z.string().length(3).optional(),
  MAX_SUBSCRIPTIONS_PER_ACCOUNT: z.coerce.number().int().positive().optional(),
  MAX_SUBSCRIPTION_NAME_LENGTH: z.coerce.number().int().positive().optional(),
  MAX_PRICE_MAJOR_UNITS: z.coerce.number().int().positive().optional(),
})

/* ------------------------------------------------------------------ *
 * Assembly
 * ------------------------------------------------------------------ */

function readYaml<T>(fileName: string, schema: z.ZodType<T>): T {
  const raw = readFileSync(join(CONFIG_DIR, fileName), 'utf8')
  const parsed = schema.safeParse(parseYaml(raw))
  if (!parsed.success) {
    throw new Error(
      `Invalid ${fileName}:\n${z.prettifyError(parsed.error)}\n` +
        `Fix the file — the app will not start on invalid config.`,
    )
  }
  return parsed.data
}

function readEnv(): z.infer<typeof envSchema> {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    // Names only. Never echo a value — that is how secrets end up in logs.
    throw new Error(
      `Invalid environment configuration:\n${z.prettifyError(parsed.error)}\n` +
        `Copy .env.example to .env and fill in the missing values.`,
    )
  }
  return parsed.data
}

const asBool = (v: 'true' | 'false' | undefined): boolean | undefined =>
  v === undefined ? undefined : v === 'true'

function build() {
  const platform = readYaml('platform.yaml', platformSchema)
  const product = readYaml('product.yaml', productSchema)
  const env = readEnv()

  const errorReporterProvider = env.ERROR_REPORTER ?? platform.error_reporter.provider
  if (errorReporterProvider === 'sentry' && !env.SENTRY_DSN) {
    // Fail loud: an error reporter that is switched on but cannot send is worse
    // than one that is honestly off, because it looks like coverage.
    throw new Error('ERROR_REPORTER=sentry requires SENTRY_DSN to be set.')
  }

  const defaultCurrency = env.DEFAULT_CURRENCY ?? product.currency.default
  if (!product.currency.allowed.includes(defaultCurrency)) {
    throw new Error(
      `Default currency "${defaultCurrency}" is not in product.yaml currency.allowed.`,
    )
  }

  return {
    env: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    appOrigin: env.APP_ORIGIN,

    database: {
      url: env.DATABASE_URL,
      poolMax: env.DB_POOL_MAX ?? platform.database.pool_max,
      connectTimeoutMs: env.DB_CONNECT_TIMEOUT_MS ?? platform.database.connect_timeout_ms,
      statementTimeoutMs: env.DB_STATEMENT_TIMEOUT_MS ?? platform.database.statement_timeout_ms,
      connectRetries: env.DB_CONNECT_RETRIES ?? platform.database.connect_retries,
      connectRetryBackoffMs:
        env.DB_CONNECT_RETRY_BACKOFF_MS ?? platform.database.connect_retry_backoff_ms,
    },

    auth: {
      secret: env.BETTER_AUTH_SECRET,
      sessionTtlDays: env.SESSION_TTL_DAYS ?? platform.session.ttl_days,
      sessionRefreshEveryDays:
        env.SESSION_REFRESH_EVERY_DAYS ?? platform.session.refresh_every_days,
      rateLimit: {
        enabled: asBool(env.RATE_LIMIT_ENABLED) ?? platform.rate_limit.enabled,
        windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS ?? platform.rate_limit.window_seconds,
        signupMaxAttempts: env.RATE_LIMIT_SIGNUP_MAX ?? platform.rate_limit.signup_max_attempts,
        loginMaxAttempts: env.RATE_LIMIT_LOGIN_MAX ?? platform.rate_limit.login_max_attempts,
      },
    },

    logging: {
      level: env.LOG_LEVEL ?? platform.logging.level,
      pretty: asBool(env.LOG_PRETTY) ?? platform.logging.pretty,
    },

    errorReporter: {
      provider: errorReporterProvider,
      dsn: env.SENTRY_DSN,
      sendTimeoutMs: env.ERROR_REPORTER_TIMEOUT_MS ?? platform.error_reporter.send_timeout_ms,
    },

    product: {
      upcomingWindowDays:
        env.RENEWALS_UPCOMING_WINDOW_DAYS ?? product.renewals.upcoming_window_days,
      defaultCurrency,
      allowedCurrencies: product.currency.allowed,
      categories: product.categories,
      billingCycles: product.billing_cycles,
      limits: {
        maxSubscriptionsPerAccount:
          env.MAX_SUBSCRIPTIONS_PER_ACCOUNT ?? product.limits.max_subscriptions_per_account,
        maxNameLength: env.MAX_SUBSCRIPTION_NAME_LENGTH ?? product.limits.max_name_length,
        maxPriceMajorUnits: env.MAX_PRICE_MAJOR_UNITS ?? product.limits.max_price_major_units,
      },
    },
  } as const
}

export type AppConfig = ReturnType<typeof build>

let cached: AppConfig | undefined

/** Returns the validated config, building it once per process. */
export function getConfig(): AppConfig {
  cached ??= build()
  return cached
}

/** Test-only: drop the cache so a test can re-read a mutated environment. */
export function resetConfigForTests(): void {
  cached = undefined
}
