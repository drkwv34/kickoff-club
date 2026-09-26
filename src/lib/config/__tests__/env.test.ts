import { afterEach, describe, expect, it } from "vitest";
import { EnvValidationError, loadEnv, resetEnvCache } from "../env";

const valid = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://kickoff:kickoff@localhost:5432/kickoff",
  SESSION_SECRET: "test-session-secret-min-32-characters-long",
  APP_BASE_URL: "http://localhost:3000",
} as const;

describe("loadEnv", () => {
  afterEach(() => {
    resetEnvCache();
  });

  it("accepts a complete local env", () => {
    const env = loadEnv({ ...valid });
    expect(env.DATABASE_URL).toContain("postgresql://");
    expect(env.SESSION_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it("rejects a short SESSION_SECRET", () => {
    expect(() =>
      loadEnv({ ...valid, SESSION_SECRET: "too-short" }),
    ).toThrow(EnvValidationError);
  });

  it("requires DATABASE_URL", () => {
    expect(() =>
      loadEnv({
        NODE_ENV: "test",
        SESSION_SECRET: valid.SESSION_SECRET,
        APP_BASE_URL: valid.APP_BASE_URL,
      }),
    ).toThrow(EnvValidationError);
  });
});
