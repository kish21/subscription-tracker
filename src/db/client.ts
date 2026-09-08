import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { getConfig } from '@/config/loader'
import * as schema from '@/db/schema'
import { logger } from '@/infra/logger'

let poolInstance: Pool | undefined
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined

export function getDbPool(): Pool {
  if (!poolInstance) {
    const config = getConfig()
    poolInstance = new Pool({
      connectionString: config.database.url,
      max: config.database.poolMax,
      connectionTimeoutMillis: config.database.connectTimeoutMs,
      idleTimeoutMillis: 30000,
      statement_timeout: config.database.statementTimeoutMs,
    })

    poolInstance.on('error', (err) => {
      logger.error('Unexpected Postgres pool error', { error: err.message })
    })
  }
  return poolInstance
}

export function getDb() {
  if (!dbInstance) {
    const pool = getDbPool()
    dbInstance = drizzle(pool, { schema })
  }
  return dbInstance
}

/** Check database connectivity with timeout */
export async function checkDbConnection(): Promise<{
  ok: boolean
  latencyMs: number
  error?: string
}> {
  const start = Date.now()
  try {
    const pool = getDbPool()
    const client = await pool.connect()
    try {
      await client.query('SELECT 1')
      return { ok: true, latencyMs: Date.now() - start }
    } finally {
      client.release()
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, latencyMs: Date.now() - start, error: msg }
  }
}

/** Close pool during graceful shutdown */
export async function closeDbPool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end()
    poolInstance = undefined
    dbInstance = undefined
  }
}
