import { describe, expect, it } from 'vitest'
import { AppError, NotFoundError, UnauthorizedError, ValidationError } from '@/infra/errors'
import { FixedClock, SystemClock } from '@/providers/clock'

describe('Infra & Providers', () => {
  describe('Clock Provider', () => {
    it('SystemClock returns real dates', () => {
      const clock = new SystemClock()
      const before = Date.now()
      const date = clock.now()
      const after = Date.now()

      expect(date.getTime()).toBeGreaterThanOrEqual(before)
      expect(date.getTime()).toBeLessThanOrEqual(after)
    })

    it('FixedClock provides deterministic time and advances', () => {
      const fixed = new FixedClock('2026-09-08T12:00:00Z')
      expect(fixed.now().toISOString()).toBe('2026-09-08T12:00:00.000Z')

      fixed.advance(60 * 1000) // 1 minute
      expect(fixed.now().toISOString()).toBe('2026-09-08T12:01:00.000Z')
    })
  })

  describe('Standard Errors', () => {
    it('instantiates NotFoundError with 404', () => {
      const err = new NotFoundError('Subscription not found')
      expect(err.statusCode).toBe(404)
      expect(err.code).toBe('NOT_FOUND')
      expect(err instanceof AppError).toBe(true)
    })

    it('instantiates UnauthorizedError with 401', () => {
      const err = new UnauthorizedError('Session expired')
      expect(err.statusCode).toBe(401)
      expect(err.code).toBe('UNAUTHORIZED')
    })

    it('instantiates ValidationError with 400', () => {
      const err = new ValidationError('Invalid amount', { field: 'price' })
      expect(err.statusCode).toBe(400)
      expect(err.code).toBe('VALIDATION_ERROR')
      expect(err.details).toEqual({ field: 'price' })
    })
  })
})
