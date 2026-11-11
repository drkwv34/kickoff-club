import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";

export const RATE_LIMITED_MESSAGE = "Too many requests";

const DEFAULT_MAX = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

type Bucket = {
  count: number;
  resetAt: number;
};

type LimitConfig = {
  max: number;
  windowMs: number;
};

const store = new Map<string, Bucket>();
let override: LimitConfig | null = null;

export type AuthRateLimitBucket =
  | "login"
  | "register"
  | "password-reset"
  | "password-reset-confirm"
  | "invite-create"
  | "invite-accept";

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "local";
}

function currentLimits(): LimitConfig {
  if (override) return override;
  const max = Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? "", 10);
  const windowMs = Number.parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? "", 10);
  return {
    max: Number.isFinite(max) && max > 0 ? max : DEFAULT_MAX,
    windowMs:
      Number.isFinite(windowMs) && windowMs > 0 ? windowMs : DEFAULT_WINDOW_MS,
  };
}

function pruneExpired(now: number): void {
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export function consumeRateLimit(
  key: string,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const { max, windowMs } = currentLimits();
  pruneExpired(now);
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (existing.count >= max) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  return { ok: true };
}

export function assertNotRateLimited(
  request: Request,
  bucket: AuthRateLimitBucket,
): void {
  const result = consumeRateLimit(`${bucket}:${clientKey(request)}`);
  if (!result.ok) {
    throw new DomainError(DomainErrorCode.RATE_LIMITED, RATE_LIMITED_MESSAGE, {
      retryAfterSeconds: result.retryAfterSeconds,
    });
  }
}

export function configureAuthRateLimitForTests(config: LimitConfig): void {
  override = config;
}

export function resetAuthRateLimitForTests(): void {
  store.clear();
  override = null;
}
