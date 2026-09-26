import { hash, verify } from "@node-rs/argon2";
import type { PasswordHasher } from "../domain/ports";

const isTest = process.env.NODE_ENV === "test";

/** OWASP Argon2id baseline; lighter params only in tests. Default algorithm is Argon2id. */
const HASH_OPTIONS = {
  memoryCost: isTest ? 4096 : 19456,
  timeCost: isTest ? 1 : 2,
  parallelism: 1,
  outputLen: 32,
} as const;

export function createArgon2PasswordHasher(): PasswordHasher {
  let dummy: Promise<string> | null = null;

  return {
    hash(password: string): Promise<string> {
      return hash(password, HASH_OPTIONS);
    },
    verify(passwordHash: string, password: string): Promise<boolean> {
      return verify(passwordHash, password);
    },
    dummyHash(): Promise<string> {
      dummy ??= hash("timing-dummy-not-a-real-password", HASH_OPTIONS);
      return dummy;
    },
  };
}
