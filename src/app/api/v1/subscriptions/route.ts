import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/auth/session'
import { subscriptionRepository } from '@/db/repositories/subscription'
import type { AllowedCurrency } from '@/domain/types'
import { AppError } from '@/infra/errors'
import { logger } from '@/infra/logger'
import {
  createSubscriptionSchema,
  subscriptionQuerySchema,
  subscriptionResponseSchema,
} from '@/schemas/subscription'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/subscriptions
 * Lists subscriptions for the authenticated tenant with optional filters (category, status, search).
 * Fail-closed: returns 401 if unauthenticated.
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
            message: 'Authentication required to access subscriptions',
          },
        },
        { status: 401 },
      )
    }

    const { searchParams } = req.nextUrl
    const queryParams: Record<string, string> = {}
    const categoryParam = searchParams.get('category')
    if (categoryParam) queryParams.category = categoryParam
    const statusParam = searchParams.get('status')
    if (statusParam) queryParams.status = statusParam
    const searchParam = searchParams.get('search')
    if (searchParam) queryParams.search = searchParam

    const parsedQuery = subscriptionQuerySchema.safeParse(queryParams)
    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: parsedQuery.error.issues,
          },
        },
        { status: 400 },
      )
    }

    const { items, totalCount } = await subscriptionRepository.list(user.id, parsedQuery.data)

    const serializedItems = items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))

    return NextResponse.json(
      {
        success: true,
        data: {
          items: serializedItems,
          totalCount,
        },
      },
      { status: 200 },
    )
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
    logger.error('Failed to list subscriptions', { error: errorMsg })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while fetching subscriptions',
        },
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/v1/subscriptions
 * Creates a new subscription for the authenticated user.
 * Inherits the user's account currency per the product specification.
 * Security DoD: Subscription names and financial prices are excluded from logs.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to create a subscription',
          },
        },
        { status: 401 },
      )
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Malformed JSON payload in request body',
          },
        },
        { status: 400 },
      )
    }

    const parsed = createSubscriptionSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid subscription payload',
            details: parsed.error.issues,
          },
        },
        { status: 400 },
      )
    }

    const created = await subscriptionRepository.create(
      user.id,
      parsed.data,
      user.currency as AllowedCurrency,
    )

    // Security: exclude subscription name & financial price from logs
    logger.info('Subscription successfully created', {
      userId: user.id,
      subscriptionId: created.id,
      billingCycle: created.billingCycle,
      category: created.category,
    })

    const serialized = {
      ...created,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    }

    // Verify response schema contract
    subscriptionResponseSchema.parse(serialized)

    return NextResponse.json(
      {
        success: true,
        data: serialized,
      },
      { status: 201 },
    )
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
    logger.error('Failed to create subscription', { error: errorMsg })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while creating subscription',
        },
      },
      { status: 500 },
    )
  }
}
