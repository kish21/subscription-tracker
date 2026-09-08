import { getConfig } from '@/config/loader'
import { logger } from '@/infra/logger'

export interface ErrorReporter {
  capture(error: unknown, context?: Record<string, unknown>): Promise<void>
}

class NoopErrorReporter implements ErrorReporter {
  async capture(error: unknown, context?: Record<string, unknown>): Promise<void> {
    logger.debug('Error captured by NoopErrorReporter', {
      error: error instanceof Error ? error.message : String(error),
      context,
    })
  }
}

class SentryStubErrorReporter implements ErrorReporter {
  private dsn: string

  constructor(dsn: string) {
    this.dsn = dsn
  }

  async capture(error: unknown, context?: Record<string, unknown>): Promise<void> {
    // Sentry adapter implementation placeholder (activated when Sentry SDK is linked at M3)
    logger.info('Error captured by SentryStubErrorReporter', {
      dsnSet: Boolean(this.dsn),
      error: error instanceof Error ? error.message : String(error),
      context,
    })
  }
}

let reporterInstance: ErrorReporter | undefined

export function getErrorReporter(): ErrorReporter {
  if (!reporterInstance) {
    const config = getConfig()
    if (config.errorReporter.provider === 'sentry' && config.errorReporter.dsn) {
      reporterInstance = new SentryStubErrorReporter(config.errorReporter.dsn)
    } else {
      reporterInstance = new NoopErrorReporter()
    }
  }
  return reporterInstance
}
