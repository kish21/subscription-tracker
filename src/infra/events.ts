/**
 * North-star metric emission (ADR-006).
 *
 * The metric is a structured log event, not an analytics vendor — shipping user
 * behaviour to a third party would contradict the product's privacy proposition.
 *
 * The event carries the user id, a timestamp and two counts. It carries NO
 * subscription name, price, category or email. That guarantee is enforced here by
 * constructing the payload field-by-field and validating it against the contract
 * before it reaches the logger — never by spreading a caller-supplied object.
 */

import { logger } from '@/infra/logger'
import { type NorthStarEvent, northStarEventSchema } from '@/schemas/events'

export interface RenewalsViewedInput {
  userId: string
  upcomingCount: number
  windowDays: number
  /** Injected for determinism in tests; defaults to now. */
  occurredAt?: Date
}

/**
 * Emits exactly one `renewals_viewed` event for an authenticated dashboard render.
 *
 * Never throws: the metric must not be able to break the page it measures. A
 * malformed event is reported as an error and dropped, rather than escaping as a
 * half-formed record that would silently corrupt the count.
 */
export function emitRenewalsViewed(input: RenewalsViewedInput): NorthStarEvent | null {
  const candidate = {
    event: 'renewals_viewed' as const,
    userId: input.userId,
    timestamp: (input.occurredAt ?? new Date()).toISOString(),
    upcomingCount: input.upcomingCount,
    windowDays: input.windowDays,
  }

  const parsed = northStarEventSchema.safeParse(candidate)
  if (!parsed.success) {
    logger.error('north_star_event_invalid', {
      reason: 'renewals_viewed payload failed contract validation',
      issues: parsed.error.issues,
    })
    return null
  }

  logger.info('renewals_viewed', parsed.data)
  return parsed.data
}
