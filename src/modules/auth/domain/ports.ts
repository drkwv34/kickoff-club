import type { UserRecord } from "./user";
import type { SessionRecord } from "./session";

export type PasswordHasher = {
  hash(password: string): Promise<string>;
  verify(passwordHash: string, password: string): Promise<boolean>;
  dummyHash(): Promise<string>;
};

export type UserRepository = {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(input: {
    email: string;
    passwordHash: string;
    displayName: string;
    timezone: string;
  }): Promise<UserRecord>;
};

export type SessionRepository = {
  create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
  }): Promise<SessionRecord>;
  findActiveByTokenHash(
    tokenHash: string,
    now: Date,
  ): Promise<{ session: SessionRecord; user: UserRecord } | null>;
  revoke(id: string, revokedAt: Date): Promise<void>;
  touchExpiry(id: string, expiresAt: Date): Promise<void>;
};

export type AuthClock = () => Date;

export type AuthDeps = {
  users: UserRepository;
  sessions: SessionRepository;
  passwords: PasswordHasher;
  clock: AuthClock;
  randomToken: () => string;
};
