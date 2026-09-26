import { describe, expect, it } from "vitest";
import {
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  clearedCookieOptions,
  csrfCookieOptions,
  isSecureCookieEnv,
  parseCookieHeader,
  serializeCookie,
  sessionCookieOptions,
} from "../cookies";

describe("session cookie flags (FR-AUTH-003 / NFR-SEC-003)", () => {
  it("sets HttpOnly, SameSite=Lax, Path=/, and Secure only in production", () => {
    const expires = new Date("2026-04-01T00:00:00.000Z");
    const options = sessionCookieOptions(expires);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("Lax");
    expect(options.path).toBe("/");
    expect(options.secure).toBe(isSecureCookieEnv());

    const header = serializeCookie(SESSION_COOKIE_NAME, "tok", options);
    expect(header).toContain("HttpOnly");
    expect(header).toMatch(/SameSite=Lax/);
    expect(header).toContain("Path=/");
    expect(header).toContain("kickoff_session=");
    if (options.secure) {
      expect(header).toContain("Secure");
    } else {
      expect(header).not.toMatch(/(?:^|; )Secure(?:;|$)/);
    }
  });

  it("marks CSRF cookies readable (not HttpOnly)", () => {
    const options = csrfCookieOptions();
    expect(options.httpOnly).toBe(false);
    expect(options.sameSite).toBe("Lax");
    const header = serializeCookie(CSRF_COOKIE_NAME, "csrf", options);
    expect(header).not.toContain("HttpOnly");
  });

  it("clears cookies with Max-Age=0", () => {
    const header = serializeCookie(
      SESSION_COOKIE_NAME,
      "",
      clearedCookieOptions(true),
    );
    expect(header).toContain("Max-Age=0");
    expect(header).toContain("HttpOnly");
  });

  it("round-trips cookie header parsing", () => {
    expect(
      parseCookieHeader("kickoff_session=abc; kickoff_csrf=xyz"),
    ).toEqual({
      kickoff_session: "abc",
      kickoff_csrf: "xyz",
    });
  });
});

describe("isSecureCookieEnv", () => {
  it("is true only for production", () => {
    expect(isSecureCookieEnv("production")).toBe(true);
    expect(isSecureCookieEnv("development")).toBe(false);
    expect(isSecureCookieEnv("test")).toBe(false);
  });
});
