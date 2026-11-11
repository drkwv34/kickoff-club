import { afterEach, describe, expect, it } from "vitest";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import {
  assertNotRateLimited,
  configureAuthRateLimitForTests,
  consumeRateLimit,
  resetAuthRateLimitForTests,
} from "../rate-limit";

describe("auth rate limit", () => {
  afterEach(() => {
    resetAuthRateLimitForTests();
  });

  it("rejects the N+1 consume within the window", () => {
    configureAuthRateLimitForTests({ max: 2, windowMs: 60_000 });
    expect(consumeRateLimit("login:1")).toEqual({ ok: true });
    expect(consumeRateLimit("login:1")).toEqual({ ok: true });
    const blocked = consumeRateLimit("login:1");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("throws RATE_LIMITED for the same client key", () => {
    configureAuthRateLimitForTests({ max: 1, windowMs: 60_000 });
    const request = new Request("http://localhost:3000/api/v1/auth/login", {
      headers: { "x-forwarded-for": "198.51.100.9" },
    });
    expect(() => assertNotRateLimited(request, "login")).not.toThrow();
    try {
      assertNotRateLimited(request, "login");
      throw new Error("expected rate limit");
    } catch (err) {
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toMatchObject({
        code: DomainErrorCode.RATE_LIMITED,
        details: { retryAfterSeconds: expect.any(Number) },
      });
    }
  });
});
