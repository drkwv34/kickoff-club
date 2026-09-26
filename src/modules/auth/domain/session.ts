export type SessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
};

/** Idle window: 14 days from last authenticated use (FR-AUTH-003). */
export const SESSION_IDLE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

/** Absolute cap: 30 days from session creation. */
export const SESSION_ABSOLUTE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Next expiry is now+14d, never past createdAt+30d.
 */
export function sessionExpiry(now: Date, createdAt: Date): Date {
  const idle = new Date(now.getTime() + SESSION_IDLE_TTL_MS);
  const absolute = new Date(createdAt.getTime() + SESSION_ABSOLUTE_TTL_MS);
  return idle.getTime() < absolute.getTime() ? idle : absolute;
}

export function isSessionActive(
  session: Pick<SessionRecord, "revokedAt" | "expiresAt">,
  now: Date,
): boolean {
  if (session.revokedAt) return false;
  return session.expiresAt.getTime() > now.getTime();
}
