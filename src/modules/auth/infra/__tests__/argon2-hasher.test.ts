import { describe, expect, it } from "vitest";
import { createArgon2PasswordHasher } from "../argon2-hasher";

describe("Argon2id hasher", () => {
  const hasher = createArgon2PasswordHasher();

  it("produces an argon2id PHC string and verifies", async () => {
    const password = "twelvechars!!";
    const hashed = await hasher.hash(password);
    expect(hashed.startsWith("$argon2id$")).toBe(true);
    expect(await hasher.verify(hashed, password)).toBe(true);
    expect(await hasher.verify(hashed, "wrong-password")).toBe(false);
  });
});
