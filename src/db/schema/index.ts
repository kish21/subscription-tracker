import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

/**
 * Better-Auth: User entity
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type UserSelect = typeof user.$inferSelect
export type UserInsert = typeof user.$inferInsert

/**
 * Better-Auth: Session entity
 */
export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_user_idx').on(table.userId)],
)

export type SessionSelect = typeof session.$inferSelect
export type SessionInsert = typeof session.$inferInsert

/**
 * Better-Auth: Account credentials entity
 */
export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('account_user_idx').on(table.userId)],
)

export type AccountSelect = typeof account.$inferSelect
export type AccountInsert = typeof account.$inferInsert

/**
 * Better-Auth: Verification entity
 */
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export type VerificationSelect = typeof verification.$inferSelect
export type VerificationInsert = typeof verification.$inferInsert

/**
 * Subscription Entity
 *
 * Rules:
 *   - Money stored as integer minor units (cents) per ADR-004.
 *   - Owned by userId tenant key per ADR-005.
 *   - Compound index (userId, nextRenewalDate) ensures fast dashboard upcoming queries.
 *   - Compound unique index (userId, idempotencyKey) prevents duplicate creation on retries.
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    priceMinorUnits: integer('price_minor_units').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    billingCycle: varchar('billing_cycle', { length: 32 }).notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    nextRenewalDate: date('next_renewal_date').notNull(),
    status: varchar('status', { length: 32 }).notNull().default('active'),
    idempotencyKey: varchar('idempotency_key', { length: 128 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('subscriptions_user_idx').on(table.userId),
    index('subscriptions_user_renewal_idx').on(table.userId, table.nextRenewalDate),
    uniqueIndex('subscriptions_user_idempotency_idx').on(table.userId, table.idempotencyKey),
  ],
)

export type SubscriptionSelect = typeof subscriptions.$inferSelect
export type SubscriptionInsert = typeof subscriptions.$inferInsert

/**
 * Health check / system heartbeat schema for walking skeleton verification
 */
export const systemHeartbeat = pgTable('system_heartbeat', {
  id: serial('id').primaryKey(),
  status: varchar('status', { length: 32 }).notNull().default('healthy'),
  checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
})

export type SystemHeartbeat = typeof systemHeartbeat.$inferSelect
export type NewSystemHeartbeat = typeof systemHeartbeat.$inferInsert

/**
 * Drizzle Relations
 */
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  subscriptions: many(subscriptions),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(user, {
    fields: [subscriptions.userId],
    references: [user.id],
  }),
}))
