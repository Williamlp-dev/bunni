import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  DIRECT_URL: z.string().url().startsWith("postgresql://").optional(),
  PORT: z.coerce.number().positive().default(3333),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173").transform((val) =>
    val.split(",").map((origin) => origin.trim())
  ),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3333"),
  BETTER_AUTH_SECRET: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_DOMAIN: z.string().url().min(1),
})

export const env = envSchema.parse(process.env)