import { getDb } from "@/lib/db/client";
import { randomSessionToken } from "./domain/crypto";
import type { AuthDeps } from "./domain/ports";
import { createArgon2PasswordHasher } from "./infra/argon2-hasher";
import { createSessionRepository } from "./infra/session-repo";
import { createUserRepository } from "./infra/user-repo";

let cached: AuthDeps | null = null;

/** Composition root — api/ui may import this; domain must not. */
export function getAuthDeps(): AuthDeps {
  if (!cached) {
    const db = getDb();
    cached = {
      users: createUserRepository(db),
      sessions: createSessionRepository(db),
      passwords: createArgon2PasswordHasher(),
      clock: () => new Date(),
      randomToken: randomSessionToken,
    };
  }
  return cached;
}

export function resetAuthDepsCache(): void {
  cached = null;
}
