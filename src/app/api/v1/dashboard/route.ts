import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/auth/session'
import { getConfig } from '@/config/loader'
import { subscriptionRepository } from '@/db/repositories/subscription'
import { buildDashboardSummary } from '@/domain/dashboard'
import type { AllowedCurrency } from '@/domain/types'
import { AppError } from '@/infra/errors'
import { logger } from '@/infra/logger'
import { systemClock } from '@/providers/clock'
import { dashboardSummarySchema } from '@/schemas/dashboard'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/dashboard
 *
 * Returns the aggregate spend summary, upcoming renewals and category breakdown
 * for the authenticated tenant. Fail-closed: 401 when unauthenticated.
 *
 * This endpoint deliberately does NOT emit the `renewals_viewed` north-star event.
 * The event marks a *user viewing their renewals*, which happens when the dashboard
 * page renders; emitting here too would double-count the first load and inflate the
 * metric on every client-side refresh. See docs/features/dashboard.md.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to access the dashboard',
          },
        },
        { status: 401 },
      )
    }

    const config = getConfig()
    const { items } = await subscriptionRepository.list(user.id)

    const summary = buildDashboardSummary(items, {
      windowDays: config.product.upcomingWindowDays,
      currency: user.currency as AllowedCurrency,
      referenceDate: systemClock.now(),
    })

    // Enforce the published contract before it leaves the boundary.
    const validated = dashboardSummarySchema.parse(summary)

    return NextResponse.json({ success: true, data: validated }, { status: 200 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            ...(error.details ? { details: error.details } : {}),
          },
        },
        { status: error.statusCode },
      )
    }

    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error('Failed to build dashboard summary', { error: errorMsg })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while building the dashboard',
        },
      },
      { status: 500 },
    )
  }
}
