import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url().optional(),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters")
    .optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

/**
 * Validates environment at boot. Scaffold: only NODE_ENV and APP_BASE_URL required.
 * Stricter requirements (DATABASE_URL, SESSION_SECRET) enforced when features wire up.
 */
export function loadEnv(
  source: NodeJS.ProcessEnv = process.env,
): AppEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const message = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment: ${JSON.stringify(message)}`);
  }
  cached = parsed.data;
  return cached;
}
