import path from 'node:path'
import { defineConfig } from 'vitest/config'

try {
  process.loadEnvFile?.('.env')
} catch {
  // Ignore if .env is missing (CI injects env vars directly) or already loaded
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          globals: true,
          environment: 'node',
          alias: {
            '@': path.resolve(import.meta.dirname, './src'),
          },
        },
      },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          fileParallelism: false,
          globals: true,
          environment: 'node',
          alias: {
            '@': path.resolve(import.meta.dirname, './src'),
          },
        },
      },
    ],
  },
})
