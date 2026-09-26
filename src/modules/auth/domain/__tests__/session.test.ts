import { describe, expect, it } from "vitest";
import {
  SESSION_ABSOLUTE_TTL_MS,
  SESSION_IDLE_TTL_MS,
  isSessionActive,
  sessionExpiry,
} from "../session";

describe("sessionExpiry", () => {
  it("uses the 14-day idle window for a new session", () => {
    const created = new Date("2026-01-01T00:00:00.000Z");
    const expiry = sessionExpiry(created, created);
    expect(expiry.getTime() - created.getTime()).toBe(SESSION_IDLE_TTL_MS);
  });

  it("never extends past 30 days from creation", () => {
    const created = new Date("2026-01-01T00:00:00.000Z");
    const now = new Date(created.getTime() + 20 * 24 * 60 * 60 * 1000);
    const expiry = sessionExpiry(now, created);
    expect(expiry.getTime() - created.getTime()).toBe(SESSION_ABSOLUTE_TTL_MS);
  });
});

describe("isSessionActive", () => {
  const now = new Date("2026-02-01T00:00:00.000Z");

  it("rejects revoked sessions", () => {
    expect(
      isSessionActive(
        { revokedAt: now, expiresAt: new Date(now.getTime() + 1000) },
        now,
      ),
    ).toBe(false);
  });

  it("rejects expired sessions", () => {
    expect(
      isSessionActive(
        { revokedAt: null, expiresAt: new Date(now.getTime() - 1) },
        now,
      ),
    ).toBe(false);
  });
});
