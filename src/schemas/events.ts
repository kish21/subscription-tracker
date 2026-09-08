import { z } from 'zod'

/**
 * North-star structured log event contract (ADR-006).
 *
 * Privacy-preserving: Contains strictly the user ID, timestamp, count, and window.
 * NEVER contains subscription names, categories, or financial prices.
 */
export const northStarEventSchema = z.object({
  event: z.literal('renewals_viewed'),
  userId: z.string().min(1),
  timestamp: z.string().datetime(),
  upcomingCount: z.number().int().min(0),
  windowDays: z.number().int().positive(),
})

export type NorthStarEvent = z.infer<typeof northStarEventSchema>
