import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import {
  ALLOWED_CURRENCIES,
  BILLING_CYCLE_MONTHS,
  BILLING_CYCLES,
  CATEGORIES,
  fromMinorUnits,
  normalizeMonthlyMinorUnits,
  normalizeYearlyMinorUnits,
  toMinorUnits,
} from '@/domain/types'
import {
  createSubscriptionSchema,
  dashboardSummarySchema,
  northStarEventSchema,
  signUpSchema,
  subscriptionResponseSchema,
  updateSubscriptionSchema,
} from '@/schemas'

interface ProductYaml {
  currency: {
    default: string
    allowed: string[]
  }
  categories: string[]
  billing_cycles: Array<{ id: string; label: string; months: number }>
}

describe('Contracts & Registry Pinning Gate', () => {
  const productYamlPath = join(process.cwd(), 'src', 'config', 'product.yaml')
  const productYamlRaw = readFileSync(productYamlPath, 'utf8')
  const productConfig = parseYaml(productYamlRaw) as ProductYaml

  describe('Registry Pinning: product.yaml ↔ Code Constants', () => {
    it('pins product.yaml categories to domain CATEGORIES constant in exact order', () => {
      expect(CATEGORIES).toEqual(productConfig.categories)
    })

    it('pins product.yaml billing cycles to domain BILLING_CYCLES and BILLING_CYCLE_MONTHS', () => {
      const yamlCycleIds = productConfig.billing_cycles.map((c) => c.id)
      expect(BILLING_CYCLES).toEqual(yamlCycleIds)

      for (const cycle of productConfig.billing_cycles) {
        expect(BILLING_CYCLE_MONTHS[cycle.id as keyof typeof BILLING_CYCLE_MONTHS]).toBe(
          cycle.months,
        )
      }
    })

    it('pins product.yaml allowed currencies to domain ALLOWED_CURRENCIES', () => {
      expect(ALLOWED_CURRENCIES).toEqual(productConfig.currency.allowed)
    })
  })

  describe('Schema↔Code Verification: Drizzle Schema ↔ Migration SQL', () => {
    it('verifies that generated migration SQL contains all expected subscription columns and constraints', () => {
      const drizzleDir = join(process.cwd(), 'drizzle')
      const sqlFiles = readdirSync(drizzleDir).filter((f) => f.endsWith('.sql'))

      expect(sqlFiles.length).toBeGreaterThan(0)

      const fullMigrationSql = sqlFiles
        .map((file) => readFileSync(join(drizzleDir, file), 'utf8'))
        .join('\n')

      // Key tables
      expect(fullMigrationSql).toContain('CREATE TABLE "user"')
      expect(fullMigrationSql).toContain('CREATE TABLE "session"')
      expect(fullMigrationSql).toContain('CREATE TABLE "account"')
      expect(fullMigrationSql).toContain('CREATE TABLE "subscriptions"')

      // Essential subscriptions columns
      const requiredColumns = [
        '"id" text PRIMARY KEY',
        '"user_id" text NOT NULL',
        '"name" varchar(100) NOT NULL',
        '"price_minor_units" integer NOT NULL',
        '"currency" varchar(3)',
        '"billing_cycle" varchar(32) NOT NULL',
        '"category" varchar(64) NOT NULL',
        '"next_renewal_date" date NOT NULL',
        '"status" varchar(32)',
        '"idempotency_key" varchar(128)',
        '"created_at" timestamp with time zone',
        '"updated_at" timestamp with time zone',
      ]

      for (const col of requiredColumns) {
        expect(fullMigrationSql).toContain(col)
      }

      // Foreign key & indexes
      expect(fullMigrationSql).toContain('REFERENCES "public"."user"("id") ON DELETE cascade')
      expect(fullMigrationSql).toContain('CREATE INDEX "subscriptions_user_idx"')
      expect(fullMigrationSql).toContain('CREATE INDEX "subscriptions_user_renewal_idx"')
      expect(fullMigrationSql).toContain('CREATE UNIQUE INDEX "subscriptions_user_idempotency_idx"')
    })
  })

  describe('Money Scale & Integer Minor Units Arithmetic (ADR-004)', () => {
    it('converts major units to minor units without floating-point distortion', () => {
      expect(toMinorUnits(14.99)).toBe(1499)
      expect(toMinorUnits(0.01)).toBe(1)
      expect(toMinorUnits(0)).toBe(0)
      expect(toMinorUnits(99.99)).toBe(9999)
      expect(toMinorUnits(1000.0)).toBe(100000)
    })

    it('converts minor units back to major units', () => {
      expect(fromMinorUnits(1499)).toBe(14.99)
      expect(fromMinorUnits(1)).toBe(0.01)
      expect(fromMinorUnits(0)).toBe(0)
    })

    it('rejects invalid inputs to money conversions', () => {
      expect(() => toMinorUnits(-5)).toThrow(TypeError)
      expect(() => toMinorUnits(Number.NaN)).toThrow(TypeError)
      expect(() => fromMinorUnits(-1)).toThrow(TypeError)
      expect(() => fromMinorUnits(14.5)).toThrow(TypeError)
    })

    it('correctly normalises prices across monthly, quarterly, semiannual, and yearly cycles', () => {
      // $120/year -> $10/month = 1000 cents
      expect(normalizeMonthlyMinorUnits(12000, 'yearly')).toBe(1000)
      expect(normalizeYearlyMinorUnits(12000, 'yearly')).toBe(12000)

      // $30/quarter -> $10/month = 1000 cents, $120/year = 12000 cents
      expect(normalizeMonthlyMinorUnits(3000, 'quarterly')).toBe(1000)
      expect(normalizeYearlyMinorUnits(3000, 'quarterly')).toBe(12000)

      // $60/semiannual -> $10/month = 1000 cents, $120/year = 12000 cents
      expect(normalizeMonthlyMinorUnits(6000, 'semiannual')).toBe(1000)
      expect(normalizeYearlyMinorUnits(6000, 'semiannual')).toBe(12000)

      // $15/month -> $15/month = 1500 cents, $180/year = 18000 cents
      expect(normalizeMonthlyMinorUnits(1500, 'monthly')).toBe(1500)
      expect(normalizeYearlyMinorUnits(1500, 'monthly')).toBe(18000)
    })
  })

  describe('Boundary Zod Contracts Validation', () => {
    it('validates a valid subscription creation payload', () => {
      const valid = {
        name: 'Netflix Premium',
        priceMinorUnits: 2299,
        billingCycle: 'monthly',
        category: 'Streaming',
        nextRenewalDate: '2026-10-15',
        idempotencyKey: 'idemp-12345',
      }
      const parsed = createSubscriptionSchema.safeParse(valid)
      expect(parsed.success).toBe(true)
    })

    it('fails closed when price is float or negative', () => {
      const floatPrice = {
        name: 'Netflix Premium',
        priceMinorUnits: 22.99, // Floating point is forbidden
        billingCycle: 'monthly',
        category: 'Streaming',
        nextRenewalDate: '2026-10-15',
      }
      expect(createSubscriptionSchema.safeParse(floatPrice).success).toBe(false)

      const negativePrice = {
        name: 'Netflix Premium',
        priceMinorUnits: -100,
        billingCycle: 'monthly',
        category: 'Streaming',
        nextRenewalDate: '2026-10-15',
      }
      expect(createSubscriptionSchema.safeParse(negativePrice).success).toBe(false)
    })

    it('fails closed on invalid dates or unknown categories', () => {
      const invalidDate = {
        name: 'Test',
        priceMinorUnits: 1000,
        billingCycle: 'monthly',
        category: 'Streaming',
        nextRenewalDate: '15/10/2026', // Not YYYY-MM-DD
      }
      expect(createSubscriptionSchema.safeParse(invalidDate).success).toBe(false)

      const unknownCategory = {
        name: 'Test',
        priceMinorUnits: 1000,
        billingCycle: 'monthly',
        category: 'Cryptocurrency', // Not in allowed categories
        nextRenewalDate: '2026-10-15',
      }
      expect(createSubscriptionSchema.safeParse(unknownCategory).success).toBe(false)
    })

    it('validates auth sign-up and sign-in schemas', () => {
      const validSignUp = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'securepassword123',
        currency: 'EUR',
      }
      expect(signUpSchema.safeParse(validSignUp).success).toBe(true)

      const invalidSignUp = {
        name: '',
        email: 'invalid-email',
        password: 'short',
        currency: 'INVALID',
      }
      expect(signUpSchema.safeParse(invalidSignUp).success).toBe(false)
    })

    it('validates update subscription schema', () => {
      const validUpdate = {
        priceMinorUnits: 2500,
        billingCycle: 'yearly',
      }
      expect(updateSubscriptionSchema.safeParse(validUpdate).success).toBe(true)

      // Empty update object should fail
      expect(updateSubscriptionSchema.safeParse({}).success).toBe(false)
    })

    it('validates subscription response schema against serialized entity', () => {
      const validResponse = {
        id: 'sub_123',
        userId: 'usr_456',
        name: 'Streaming Plus',
        priceMinorUnits: 1499,
        currency: 'USD',
        billingCycle: 'monthly',
        category: 'Streaming',
        nextRenewalDate: '2026-10-01',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(subscriptionResponseSchema.safeParse(validResponse).success).toBe(true)
    })

    it('validates dashboard summary response schema', () => {
      const validSummary = {
        totalMonthlyMinorUnits: 4500,
        totalYearlyMinorUnits: 54000,
        currency: 'USD',
        activeCount: 3,
        upcomingCount: 1,
        upcomingWindowDays: 30,
        upcomingRenewals: [
          {
            id: 'sub_123',
            name: 'Streaming Plus',
            priceMinorUnits: 1499,
            currency: 'USD',
            billingCycle: 'monthly',
            category: 'Streaming',
            renewalDate: '2026-09-20',
            daysUntilRenewal: 12,
          },
        ],
        categoryBreakdown: [
          {
            category: 'Streaming',
            totalMonthlyMinorUnits: 1499,
            percentage: 33.3,
            subscriptionCount: 1,
          },
        ],
      }
      expect(dashboardSummarySchema.safeParse(validSummary).success).toBe(true)
    })

    it('validates the North-Star structured log event contract', () => {
      const validEvent = {
        event: 'renewals_viewed',
        userId: 'usr_abc123',
        timestamp: new Date().toISOString(),
        upcomingCount: 3,
        windowDays: 30,
      }
      const parsed = northStarEventSchema.safeParse(validEvent)
      expect(parsed.success).toBe(true)
    })
  })
})
