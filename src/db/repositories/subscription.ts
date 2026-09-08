import { randomUUID } from 'node:crypto'
import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { getDb } from '@/db/client'
import { subscriptions } from '@/db/schema'
import type {
  AllowedCurrency,
  BillingCycle,
  Category,
  Subscription,
  SubscriptionStatus,
} from '@/domain/types'
import type {
  CreateSubscriptionInput,
  SubscriptionQueryInput,
  UpdateSubscriptionInput,
} from '@/schemas/subscription'

export interface SubscriptionRepository {
  create(
    userId: string,
    input: CreateSubscriptionInput,
    currency: AllowedCurrency,
  ): Promise<Subscription>
  findById(userId: string, id: string): Promise<Subscription | null>
  findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<Subscription | null>
  list(
    userId: string,
    filter?: SubscriptionQueryInput,
  ): Promise<{ items: Subscription[]; totalCount: number }>
  update(userId: string, id: string, input: UpdateSubscriptionInput): Promise<Subscription | null>
  delete(userId: string, id: string): Promise<boolean>
}

function escapeLikePattern(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&')
}

function toDomainSubscription(row: typeof subscriptions.$inferSelect): Subscription {
  const renewalDateStr =
    (row.nextRenewalDate as unknown) instanceof Date
      ? (row.nextRenewalDate as unknown as Date).toISOString().slice(0, 10)
      : String(row.nextRenewalDate)

  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    priceMinorUnits: row.priceMinorUnits,
    currency: row.currency as AllowedCurrency,
    billingCycle: row.billingCycle as BillingCycle,
    category: row.category as Category,
    nextRenewalDate: renewalDateStr,
    status: row.status as SubscriptionStatus,
    idempotencyKey: row.idempotencyKey ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class DrizzleSubscriptionRepository implements SubscriptionRepository {
  /**
   * Creates a new subscription.
   * If an idempotencyKey is provided and a record with the same (userId, idempotencyKey)
   * already exists, returns the existing record to prevent duplicate creations.
   * Gracefully handles concurrent race conditions by catching PostgreSQL unique constraint (23505).
   */
  async create(
    userId: string,
    input: CreateSubscriptionInput,
    currency: AllowedCurrency,
  ): Promise<Subscription> {
    const db = getDb()

    if (input.idempotencyKey) {
      const existing = await this.findByIdempotencyKey(userId, input.idempotencyKey)
      if (existing) {
        return existing
      }
    }

    const id = randomUUID()
    const now = new Date()

    try {
      const [inserted] = await db
        .insert(subscriptions)
        .values({
          id,
          userId,
          name: input.name,
          priceMinorUnits: input.priceMinorUnits,
          currency,
          billingCycle: input.billingCycle,
          category: input.category,
          nextRenewalDate: input.nextRenewalDate,
          status: 'active',
          idempotencyKey: input.idempotencyKey ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      return toDomainSubscription(inserted)
    } catch (error) {
      const err = error as { code?: string; cause?: { code?: string } }
      const isUniqueConstraint = err?.code === '23505' || err?.cause?.code === '23505'

      if (input.idempotencyKey && isUniqueConstraint) {
        const existing = await this.findByIdempotencyKey(userId, input.idempotencyKey)
        if (existing) {
          return existing
        }
      }
      throw error
    }
  }

  /**
   * Looks up a subscription by ID with strict tenant isolation (userId).
   * ADR-005: Every repository query requires userId.
   */
  async findById(userId: string, id: string): Promise<Subscription | null> {
    const db = getDb()

    const [row] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.id, id)))
      .limit(1)

    return row ? toDomainSubscription(row) : null
  }

  /**
   * Looks up a subscription by idempotency key with strict tenant isolation (userId).
   */
  async findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<Subscription | null> {
    const db = getDb()

    const [row] = await db
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.userId, userId), eq(subscriptions.idempotencyKey, idempotencyKey)),
      )
      .limit(1)

    return row ? toDomainSubscription(row) : null
  }

  /**
   * Lists subscriptions for a given tenant (userId) with optional filters.
   * Returns items and totalCount.
   */
  async list(
    userId: string,
    filter?: SubscriptionQueryInput,
  ): Promise<{ items: Subscription[]; totalCount: number }> {
    const db = getDb()

    const conditions = [eq(subscriptions.userId, userId)]

    if (filter?.category) {
      conditions.push(eq(subscriptions.category, filter.category))
    }

    if (filter?.status) {
      conditions.push(eq(subscriptions.status, filter.status))
    }

    if (filter?.search) {
      const escaped = escapeLikePattern(filter.search)
      conditions.push(ilike(subscriptions.name, `%${escaped}%`))
    }

    const whereClause = and(...conditions)

    const [countResult, rows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(subscriptions).where(whereClause),
      db
        .select()
        .from(subscriptions)
        .where(whereClause)
        .orderBy(subscriptions.nextRenewalDate, desc(subscriptions.createdAt)),
    ])

    const totalCount = countResult[0]?.count ?? 0
    const items = rows.map(toDomainSubscription)

    return { items, totalCount }
  }

  /**
   * Updates an existing subscription for a tenant (userId).
   * Returns updated Subscription or null if not found.
   */
  async update(
    userId: string,
    id: string,
    input: UpdateSubscriptionInput,
  ): Promise<Subscription | null> {
    const db = getDb()

    const updatePayload: Partial<typeof subscriptions.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.name !== undefined) updatePayload.name = input.name
    if (input.priceMinorUnits !== undefined) updatePayload.priceMinorUnits = input.priceMinorUnits
    if (input.billingCycle !== undefined) updatePayload.billingCycle = input.billingCycle
    if (input.category !== undefined) updatePayload.category = input.category
    if (input.nextRenewalDate !== undefined) updatePayload.nextRenewalDate = input.nextRenewalDate
    if (input.status !== undefined) updatePayload.status = input.status

    const [updated] = await db
      .update(subscriptions)
      .set(updatePayload)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.id, id)))
      .returning()

    return updated ? toDomainSubscription(updated) : null
  }

  /**
   * Deletes a subscription for a tenant (userId).
   * Returns true if deleted, false if record was not found or owned by another user.
   */
  async delete(userId: string, id: string): Promise<boolean> {
    const db = getDb()

    const result = await db
      .delete(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.id, id)))
      .returning({ id: subscriptions.id })

    return result.length > 0
  }
}

export const subscriptionRepository = new DrizzleSubscriptionRepository()
