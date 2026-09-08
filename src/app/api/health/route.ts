import { NextResponse } from 'next/server'
import { getConfig } from '@/config/loader'
import { checkDbConnection } from '@/db/client'
import { logger } from '@/infra/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = getConfig()
    const dbStatus = await checkDbConnection()

    const isHealthy = dbStatus.ok
    const statusCode = isHealthy ? 200 : 503

    const responsePayload = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      env: config.env,
      database: {
        connected: dbStatus.ok,
        latencyMs: dbStatus.latencyMs,
        ...(dbStatus.error ? { error: dbStatus.error } : {}),
      },
    }

    if (!isHealthy) {
      logger.warn('Health check reported degraded status', responsePayload)
    }

    return NextResponse.json(responsePayload, { status: statusCode })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error('Health check endpoint failed critically', { error: message })

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: message,
      },
      { status: 500 },
    )
  }
}
