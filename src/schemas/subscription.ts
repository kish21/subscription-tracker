import { z } from 'zod'
import { billingCycleSchema, categorySchema, currencySchema, dateStringSchema } from './common'

/**
 * Limit: max price in major units is 1,000,000.00 = 100,000,000 minor units (cents).
 * Money is strictly integer minor units (ADR-004).
 */
export const MAX_PRICE_MINOR_UNITS = 100_000_000

export const createSubscriptionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Subscription name is required')
    .max(100, 'Subscription name cannot exceed 100 characters'),
  priceMinorUnits: z
    .number({ message: 'Price in minor units (cents) is required' })
    .int('Price must be an integer number of minor units (cents)')
    .min(0, 'Price cannot be negative')
    .max(MAX_PRICE_MINOR_UNITS, 'Price exceeds maximum allowed limit'),
  billingCycle: billingCycleSchema,
  category: categorySchema,
  nextRenewalDate: dateStringSchema,
  idempotencyKey: z.string().trim().min(1).max(128).optional(),
})

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>

export const updateSubscriptionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Subscription name cannot be empty')
      .max(100, 'Subscription name cannot exceed 100 characters')
      .optional(),
    priceMinorUnits: z
      .number()
      .int('Price must be an integer number of minor units (cents)')
      .min(0, 'Price cannot be negative')
      .max(MAX_PRICE_MINOR_UNITS, 'Price exceeds maximum allowed limit')
      .optional(),
    billingCycle: billingCycleSchema.optional(),
    category: categorySchema.optional(),
    nextRenewalDate: dateStringSchema.optional(),
    status: z.enum(['active', 'cancelled']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  })

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>

export const subscriptionQuerySchema = z.object({
  category: categorySchema.optional(),
  status: z.enum(['active', 'cancelled']).optional(),
  search: z.string().trim().max(100).optional(),
})

export type SubscriptionQueryInput = z.infer<typeof subscriptionQuerySchema>

export const subscriptionResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  priceMinorUnits: z.number().int(),
  currency: currencySchema,
  billingCycle: billingCycleSchema,
  category: categorySchema,
  nextRenewalDate: dateStringSchema,
  status: z.enum(['active', 'cancelled']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type SubscriptionResponse = z.infer<typeof subscriptionResponseSchema>

export const subscriptionListResponseSchema = z.object({
  items: z.array(subscriptionResponseSchema),
  totalCount: z.number().int().min(0),
})

export type SubscriptionListResponse = z.infer<typeof subscriptionListResponseSchema>
