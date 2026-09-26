import { describe, expect, it } from "vitest";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { INVALID_CREDENTIALS_MESSAGE } from "../messages";
import type { AuthDeps, PasswordHasher, SessionRepository, UserRepository } from "../ports";
import type { SessionRecord } from "../session";
import type { UserRecord } from "../user";
import { loginUser } from "../login";
import { logoutSession } from "../logout";
import { registerUser } from "../register";
import { resolveSession } from "../resolve-session";

function fakeHasher(): PasswordHasher {
  return {
    async hash(password) {
      return `hashed:${password}`;
    },
    async verify(passwordHash, password) {
      if (passwordHash === "dummy") return false;
      return passwordHash === `hashed:${password}`;
    },
    async dummyHash() {
      return "dummy";
    },
  };
}

function memoryDeps(): AuthDeps & {
  userStore: UserRecord[];
  sessionStore: SessionRecord[];
} {
  const userStore: UserRecord[] = [];
  const sessionStore: SessionRecord[] = [];
  const now = new Date("2026-03-01T12:00:00.000Z");
  let seq = 1;

  const users: UserRepository = {
    async findByEmail(email) {
      const needle = email.toLowerCase();
      return (
        userStore.find((u) => u.email.toLowerCase() === needle) ?? null
      );
    },
    async findById(id) {
      return userStore.find((u) => u.id === id) ?? null;
    },
    async create(input) {
      const user: UserRecord = {
        id: `user-${seq++}`,
        email: input.email,
        passwordHash: input.passwordHash,
        displayName: input.displayName,
        timezone: input.timezone,
        createdAt: now,
        updatedAt: now,
      };
      userStore.push(user);
      return user;
    },
  };

  const sessions: SessionRepository = {
    async create(input) {
      const session: SessionRecord = {
        id: `sess-${seq++}`,
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        createdAt: input.createdAt,
        revokedAt: null,
      };
      sessionStore.push(session);
      return session;
    },
    async findActiveByTokenHash(tokenHash, at) {
      const session = sessionStore.find(
        (s) =>
          s.tokenHash === tokenHash &&
          s.revokedAt === null &&
          s.expiresAt.getTime() > at.getTime(),
      );
      if (!session) return null;
      const user = userStore.find((u) => u.id === session.userId);
      if (!user) return null;
      return { session, user };
    },
    async revoke(id, revokedAt) {
      const session = sessionStore.find((s) => s.id === id);
      if (session && !session.revokedAt) session.revokedAt = revokedAt;
    },
    async touchExpiry(id, expiresAt) {
      const session = sessionStore.find((s) => s.id === id);
      if (session) session.expiresAt = expiresAt;
    },
  };

  const deps: AuthDeps = {
    users,
    sessions,
    passwords: fakeHasher(),
    clock: () => now,
    randomToken: () => `tok-${seq++}`,
  };

  return Object.assign(deps, { userStore, sessionStore });
}

const validRegister = {
  email: "player@example.com",
  password: "twelvechars!!",
  displayName: "Ada",
  timezone: "America/Bogota",
};

describe("registerUser", () => {
  it("creates a user and session without exposing the password hash", async () => {
    const deps = memoryDeps();
    const result = await registerUser(validRegister, deps);
    expect(result.user.email).toBe("player@example.com");
    expect(result.sessionToken).toBeTruthy();
    expect(result).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(result)).not.toContain("hashed:");
  });

  it("rejects a duplicate email case-insensitively", async () => {
    const deps = memoryDeps();
    await registerUser(validRegister, deps);
    await expect(
      registerUser({ ...validRegister, email: "Player@Example.com" }, deps),
    ).rejects.toMatchObject({
      code: DomainErrorCode.EMAIL_TAKEN,
    });
  });
});

describe("loginUser", () => {
  it("uses the same message for unknown email and bad password", async () => {
    const deps = memoryDeps();
    await registerUser(validRegister, deps);

    let unknown: unknown;
    try {
      await loginUser(
        { email: "missing@example.com", password: "twelvechars!!" },
        deps,
      );
    } catch (err) {
      unknown = err;
    }

    let badPassword: unknown;
    try {
      await loginUser(
        { email: validRegister.email, password: "wrong-password" },
        deps,
      );
    } catch (err) {
      badPassword = err;
    }

    expect(unknown).toBeInstanceOf(DomainError);
    expect(badPassword).toBeInstanceOf(DomainError);
    const a = unknown as DomainError;
    const b = badPassword as DomainError;
    expect(a.code).toBe(DomainErrorCode.INVALID_CREDENTIALS);
    expect(b.code).toBe(DomainErrorCode.INVALID_CREDENTIALS);
    expect(a.message).toBe(INVALID_CREDENTIALS_MESSAGE);
    expect(b.message).toBe(a.message);
  });
});

describe("logoutSession + resolveSession", () => {
  it("rejects a revoked session token", async () => {
    const deps = memoryDeps();
    const registered = await registerUser(validRegister, deps);
    const before = await resolveSession(registered.sessionToken, deps);
    expect(before?.user.id).toBe(registered.user.id);

    await logoutSession(registered.sessionId, deps);
    const after = await resolveSession(registered.sessionToken, deps);
    expect(after).toBeNull();
  });
});
