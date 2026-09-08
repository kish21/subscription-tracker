import pino from 'pino'
import { getConfig } from '@/config/loader'

let loggerInstance: pino.Logger | undefined

export function getLogger(): pino.Logger {
  if (!loggerInstance) {
    const config = getConfig()
    loggerInstance = pino({
      level: config.logging.level,
      transport: config.logging.pretty
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
      base: {
        env: config.env,
      },
      redact: {
        paths: [
          'password',
          'secret',
          'token',
          '*.password',
          '*.secret',
          '*.token',
          'authorization',
          'cookie',
        ],
        censor: '[REDACTED]',
      },
    })
  }
  return loggerInstance
}

export const logger = {
  trace: (msg: string, ctx?: Record<string, unknown>) => getLogger().trace(ctx, msg),
  debug: (msg: string, ctx?: Record<string, unknown>) => getLogger().debug(ctx, msg),
  info: (msg: string, ctx?: Record<string, unknown>) => getLogger().info(ctx, msg),
  warn: (msg: string, ctx?: Record<string, unknown>) => getLogger().warn(ctx, msg),
  error: (msg: string, ctx?: Record<string, unknown>) => getLogger().error(ctx, msg),
  fatal: (msg: string, ctx?: Record<string, unknown>) => getLogger().fatal(ctx, msg),
  child: (bindings: Record<string, unknown>) => getLogger().child(bindings),
}
