import { hashToken } from "./crypto";
import type { AuthDeps } from "./ports";
import {
  isSessionActive,
  sessionExpiry,
  type SessionRecord,
} from "./session";
import { toPublicUser, type PublicUser, type UserRecord } from "./user";

const SLIDE_IF_EXTENDED_BY_MS = 60_000;

export type ResolvedSession = {
  session: SessionRecord;
  user: PublicUser;
  userRecord: UserRecord;
  expiresAt: Date;
};

export async function resolveSession(
  rawToken: string,
  deps: Pick<AuthDeps, "sessions" | "clock">,
): Promise<ResolvedSession | null> {
  if (!rawToken) return null;

  const now = deps.clock();
  const found = await deps.sessions.findActiveByTokenHash(
    hashToken(rawToken),
    now,
  );
  if (!found || !isSessionActive(found.session, now)) {
    return null;
  }

  const nextExpiry = sessionExpiry(now, found.session.createdAt);
  let expiresAt = found.session.expiresAt;
  if (nextExpiry.getTime() - found.session.expiresAt.getTime() > SLIDE_IF_EXTENDED_BY_MS) {
    await deps.sessions.touchExpiry(found.session.id, nextExpiry);
    expiresAt = nextExpiry;
  }

  return {
    session: { ...found.session, expiresAt },
    user: toPublicUser(found.user),
    userRecord: found.user,
    expiresAt,
  };
}
