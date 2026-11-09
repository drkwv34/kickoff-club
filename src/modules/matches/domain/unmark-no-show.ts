import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { loadMatchForOrganizer } from "./access";
import { NO_SHOW_NOT_FOUND_MESSAGE } from "./messages";
import type { MatchesDeps } from "./ports";

export async function unmarkNoShow(
  matchId: string,
  targetUserId: string,
  actorId: string,
  deps: MatchesDeps,
): Promise<void> {
  const { match } = await loadMatchForOrganizer(matchId, actorId, deps);
  const existing = await deps.noShows.findByMatchAndUser(matchId, targetUserId);
  if (!existing) {
    throw new DomainError(DomainErrorCode.NOT_FOUND, NO_SHOW_NOT_FOUND_MESSAGE);
  }

  await deps.noShows.deleteByMatchAndUser(matchId, targetUserId);
  const remaining = await deps.noShows.countForUserInGroup(
    match.groupId,
    targetUserId,
  );
  await deps.memberships.setNoShowCount(match.groupId, targetUserId, remaining);
}

export async function listNoShowsForMatch(
  matchId: string,
  actorId: string,
  deps: MatchesDeps,
): Promise<Array<{ userId: string; markedAt: string }>> {
  await loadMatchForOrganizer(matchId, actorId, deps);
  const rows = await deps.noShows.listByMatchId(matchId);
  return rows.map((row) => ({
    userId: row.userId,
    markedAt: row.markedAt.toISOString(),
  }));
}
