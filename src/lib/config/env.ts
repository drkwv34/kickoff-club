import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid Postgres connection URL"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  readonly fieldErrors: Record<string, string[] | undefined>;

  constructor(fieldErrors: Record<string, string[] | undefined>) {
    super(`Invalid environment: ${JSON.stringify(fieldErrors)}`);
    this.name = "EnvValidationError";
    this.fieldErrors = fieldErrors;
  }
}

let cached: AppEnv | null = null;

/**
 * Validates environment at boot. Fail fast: DATABASE_URL and SESSION_SECRET
 * are required (Day 2+). Pass a custom `source` in tests to avoid the cache.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const useCache = source === process.env;
  if (useCache && cached) return cached;

  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new EnvValidationError(parsed.error.flatten().fieldErrors);
  }

  if (useCache) {
    cached = parsed.data;
  }
  return parsed.data;
}

export function resetEnvCache(): void {
  cached = null;
}
