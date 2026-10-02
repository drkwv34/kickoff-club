import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { RSVP_NOT_FOUND_MESSAGE } from "@/modules/rsvps/domain/messages";
import { loadMatchForOrganizer } from "./access";
import {
  MATCH_NOT_STARTED_MESSAGE,
  NO_SHOW_ALREADY_MARKED_MESSAGE,
  NOT_GOING_FOR_NO_SHOW_MESSAGE,
} from "./messages";
import type { MatchesDeps } from "./ports";

export type MarkNoShowResult = {
  noShow: {
    id: string;
    matchId: string;
    userId: string;
    markedBy: string;
    markedAt: string;
  };
  noShowCount: number;
};

export async function markNoShow(
  matchId: string,
  targetUserId: string,
  actorId: string,
  deps: MatchesDeps,
): Promise<MarkNoShowResult> {
  const { match } = await loadMatchForOrganizer(matchId, actorId, deps);
  const now = deps.clock();
  if (now.getTime() < match.startAt.getTime()) {
    throw new DomainError(DomainErrorCode.CONFLICT, MATCH_NOT_STARTED_MESSAGE);
  }

  const existingNoShow = await deps.noShows.findByMatchAndUser(
    matchId,
    targetUserId,
  );
  if (existingNoShow) {
    throw new DomainError(
      DomainErrorCode.CONFLICT,
      NO_SHOW_ALREADY_MARKED_MESSAGE,
    );
  }

  const rsvp = await deps.rsvps.findByMatchAndUser(matchId, targetUserId);
  if (!rsvp || rsvp.status !== "going") {
    throw new DomainError(
      DomainErrorCode.CONFLICT,
      NOT_GOING_FOR_NO_SHOW_MESSAGE,
    );
  }

  const membership = await deps.memberships.find(match.groupId, targetUserId);
  if (!membership) {
    throw new DomainError(DomainErrorCode.NOT_FOUND, RSVP_NOT_FOUND_MESSAGE);
  }

  const markedAt = deps.clock();
  const noShow = await deps.noShows.create({
    matchId,
    userId: targetUserId,
    markedBy: actorId,
    markedAt,
  });
  const updatedMembership = await deps.memberships.incrementNoShowCount(
    match.groupId,
    targetUserId,
  );

  return {
    noShow: {
      id: noShow.id,
      matchId: noShow.matchId,
      userId: noShow.userId,
      markedBy: noShow.markedBy,
      markedAt: noShow.markedAt.toISOString(),
    },
    noShowCount: updatedMembership.noShowCount,
  };
}
