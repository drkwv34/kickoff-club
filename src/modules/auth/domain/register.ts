import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { hashToken } from "./crypto";
import { EMAIL_TAKEN_MESSAGE } from "./messages";
import type { AuthDeps } from "./ports";
import { sessionExpiry } from "./session";
import { toPublicUser, type PublicUser } from "./user";

export type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
  timezone: string;
};

export type AuthResult = {
  user: PublicUser;
  sessionToken: string;
  sessionId: string;
  expiresAt: Date;
};

export async function registerUser(
  input: RegisterInput,
  deps: AuthDeps,
): Promise<AuthResult> {
  const email = input.email.trim();
  const displayName = input.displayName.trim();

  const existing = await deps.users.findByEmail(email);
  if (existing) {
    throw new DomainError(DomainErrorCode.EMAIL_TAKEN, EMAIL_TAKEN_MESSAGE);
  }

  const passwordHash = await deps.passwords.hash(input.password);
  const user = await deps.users.create({
    email,
    passwordHash,
    displayName,
    timezone: input.timezone,
  });

  return issueSession(user, deps);
}

export async function issueSession(
  user: Parameters<typeof toPublicUser>[0],
  deps: AuthDeps,
): Promise<AuthResult> {
  const now = deps.clock();
  const sessionToken = deps.randomToken();
  const session = await deps.sessions.create({
    userId: user.id,
    tokenHash: hashToken(sessionToken),
    createdAt: now,
    expiresAt: sessionExpiry(now, now),
  });

  return {
    user: toPublicUser(user),
    sessionToken,
    sessionId: session.id,
    expiresAt: session.expiresAt,
  };
}
