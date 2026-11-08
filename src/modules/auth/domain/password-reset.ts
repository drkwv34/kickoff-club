import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { hashToken } from "./crypto";
import { PASSWORD_RESET_GONE_MESSAGE } from "./messages";
import type { AuthDeps } from "./ports";
import { issueSession, type AuthResult } from "./register";

/** One-hour TTL for unused reset tokens. */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export type PasswordResetTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

export type RequestedPasswordReset = {
  email: string;
  token: string;
  resetPath: string;
};

export async function requestPasswordReset(
  email: string,
  deps: AuthDeps,
): Promise<RequestedPasswordReset | null> {
  const user = await deps.users.findByEmail(email.trim());
  if (!user) {
    await deps.passwords.dummyHash();
    return null;
  }

  const now = deps.clock();
  await deps.passwordResets.invalidateUnusedForUser(user.id, now);

  const token = deps.randomToken();
  await deps.passwordResets.create({
    userId: user.id,
    tokenHash: hashToken(token),
    createdAt: now,
    expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
  });

  return {
    email: user.email,
    token,
    resetPath: `/reset-password?token=${encodeURIComponent(token)}`,
  };
}

export async function confirmPasswordReset(
  input: { token: string; password: string },
  deps: AuthDeps,
): Promise<AuthResult> {
  const now = deps.clock();
  const record = await deps.passwordResets.findByTokenHash(
    hashToken(input.token),
  );
  if (
    !record ||
    record.usedAt !== null ||
    record.expiresAt.getTime() <= now.getTime()
  ) {
    throw new DomainError(DomainErrorCode.GONE, PASSWORD_RESET_GONE_MESSAGE);
  }

  const passwordHash = await deps.passwords.hash(input.password);
  const user = await deps.users.updatePassword(record.userId, passwordHash);
  await deps.passwordResets.markUsed(record.id, now);
  await deps.sessions.revokeAllForUser(record.userId, now);
  return issueSession(user, deps);
}
