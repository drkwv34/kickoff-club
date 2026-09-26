import { describe, expect, it } from "vitest";
import { hashToken, randomSessionToken, timingSafeStringEqual } from "../crypto";

describe("session tokens", () => {
  it("hashes tokens with sha256 hex", () => {
    const token = "abc";
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(hashToken("abd"));
  });

  it("generates unique random tokens", () => {
    expect(randomSessionToken()).not.toBe(randomSessionToken());
  });

  it("compares strings in a length-safe way", () => {
    expect(timingSafeStringEqual("token-a", "token-a")).toBe(true);
    expect(timingSafeStringEqual("token-a", "token-b")).toBe(false);
    expect(timingSafeStringEqual("short", "longer-value")).toBe(false);
  });
});
