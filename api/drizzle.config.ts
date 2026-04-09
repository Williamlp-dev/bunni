import { defineConfig } from 'drizzle-kit'
import { env } from '@/env'

export default defineConfig({
  schema: './src/database/schema/*.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DIRECT_URL || env.DATABASE_URL,
  },
  casing: "snake_case",
})
