import { headers } from 'next/headers'
import { auth } from '@/auth/server'
import { UnauthorizedError } from '@/infra/errors'
import { logger } from '@/infra/logger'

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  currency: string
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface SessionData {
  user: AuthenticatedUser
  session: {
    id: string
    expiresAt: Date
    token: string
    ipAddress?: string | null
    userAgent?: string | null
    userId: string
  }
}

/**
 * Fail-closed session reader per ADR-002.
 * Returns the authenticated user or null if unauthenticated or on any error.
 * Never throws on bad credentials or corrupted tokens — failures are logged and resolved to null.
 */
export async function getCurrentUser(
  reqOrHeaders?: Request | Headers,
): Promise<AuthenticatedUser | null> {
  try {
    let resolvedHeaders: Headers
    if (reqOrHeaders instanceof Request) {
      resolvedHeaders = reqOrHeaders.headers
    } else if (reqOrHeaders instanceof Headers) {
      resolvedHeaders = reqOrHeaders
    } else {
      resolvedHeaders = await headers()
    }

    const sessionData = await auth.api.getSession({
      headers: resolvedHeaders,
    })

    if (!sessionData?.user) {
      return null
    }

    const user = sessionData.user as unknown as Record<string, unknown>
    return {
      id: String(user.id),
      name: String(user.name),
      email: String(user.email),
      emailVerified: Boolean(user.emailVerified),
      currency: typeof user.currency === 'string' ? user.currency : 'USD',
      image: typeof user.image === 'string' ? user.image : null,
      createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(String(user.createdAt)),
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt : new Date(String(user.updatedAt)),
    }
  } catch (error) {
    // Fail closed per ADR-002
    logger.warn('Session verification failed, treating as unauthenticated', {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

/**
 * Fail-closed authentication guard.
 * Returns the AuthenticatedUser or throws UnauthorizedError (HTTP 401).
 */
export async function requireAuth(reqOrHeaders?: Request | Headers): Promise<AuthenticatedUser> {
  const user = await getCurrentUser(reqOrHeaders)
  if (!user) {
    throw new UnauthorizedError('Authentication required to access this resource')
  }
  return user
}
