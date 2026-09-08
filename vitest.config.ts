import path from 'node:path'
import { defineConfig } from 'vitest/config'

process.loadEnvFile?.('.env')

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
