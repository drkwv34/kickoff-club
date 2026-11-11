import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { GET as csrf } from "@/app/api/v1/auth/csrf/route";
import { CSRF_COOKIE_NAME } from "@/lib/http/cookies";
import {
  configureAuthRateLimitForTests,
  resetAuthRateLimitForTests,
} from "@/lib/http/rate-limit";
import { ensureTestSchema, resetAuthTables } from "@/lib/db/test-helpers";
import { DomainErrorCode } from "@/lib/errors/domain-error";

const ORIGIN = "http://localhost:3000";
const CLIENT_IP = "203.0.113.50";
const MAX_ATTEMPTS = 5;

function cookieFromSetCookie(lines: string[], name: string): string | undefined {
  const line = lines.find((entry) => entry.startsWith(`${name}=`));
  if (!line) return undefined;
  const pair = line.split(";", 1)[0];
  const eq = pair.indexOf("=");
  return decodeURIComponent(pair.slice(eq + 1));
}

async function csrfPair(): Promise<{ token: string; cookieHeader: string }> {
  const res = await csrf(new Request(`${ORIGIN}/api/v1/auth/csrf`));
  const body = (await res.json()) as { csrfToken: string };
  const cookies = res.headers.getSetCookie();
  const fromHeader = cookieFromSetCookie(cookies, CSRF_COOKIE_NAME);
  const token = body.csrfToken;
  const cookieHeader = `${CSRF_COOKIE_NAME}=${encodeURIComponent(fromHeader ?? token)}`;
  return { token, cookieHeader };
}

describe("auth rate limit HTTP integration", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetAuthTables();
    resetAuthRateLimitForTests();
    configureAuthRateLimitForTests({
      max: MAX_ATTEMPTS,
      windowMs: 60_000,
    });
  });

  afterAll(async () => {
    resetAuthRateLimitForTests();
    await resetAuthTables();
  });

  it("returns 429 RATE_LIMITED with Retry-After after N+1 failed logins", async () => {
    let last: Response | undefined;
    for (let i = 0; i < MAX_ATTEMPTS + 1; i += 1) {
      const { token, cookieHeader } = await csrfPair();
      last = await login(
        new Request(`${ORIGIN}/api/v1/auth/login`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: ORIGIN,
            cookie: cookieHeader,
            "x-csrf-token": token,
            "x-forwarded-for": CLIENT_IP,
          },
          body: JSON.stringify({
            email: "missing@example.com",
            password: "definitely-wrong-password",
          }),
        }),
      );
    }

    expect(last).toBeDefined();
    expect(last?.status).toBe(429);
    const retryAfter = last?.headers.get("retry-after");
    expect(retryAfter).toBeTruthy();
    expect(Number(retryAfter)).toBeGreaterThan(0);
    const body = (await last!.json()) as {
      code: string;
      message: string;
      details?: { retryAfterSeconds?: number };
    };
    expect(body.code).toBe(DomainErrorCode.RATE_LIMITED);
    expect(body.message).toBeTruthy();
    expect(body.details?.retryAfterSeconds).toBeGreaterThan(0);
  });
});
