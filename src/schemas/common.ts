import { z } from 'zod'
import { ALLOWED_CURRENCIES, BILLING_CYCLES, CATEGORIES } from '@/domain/types'

/**
 * Valid ISO-8601 calendar date format (YYYY-MM-DD).
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')

export const currencySchema = z.enum(ALLOWED_CURRENCIES)
export const billingCycleSchema = z.enum(BILLING_CYCLES)
export const categorySchema = z.enum(CATEGORIES)

/**
 * Standard API error response shape
 */
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
})

export type ApiError = z.infer<typeof apiErrorSchema>

/**
 * Standard API success response envelope
 */
export function createSuccessEnvelope<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  })
}

/**
 * Standard API error response envelope
 */
export const errorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: apiErrorSchema,
})

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>
