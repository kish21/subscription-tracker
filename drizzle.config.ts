import { defineConfig } from 'drizzle-kit'

try {
  process.loadEnvFile?.()
} catch {
  // Ignore if .env is missing or already loaded
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://tracker:tracker_local_dev@localhost:5432/subscription_tracker',
  },
  strict: true,
  verbose: true,
})
