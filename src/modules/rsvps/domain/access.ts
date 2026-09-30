import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { requireMember } from "@/modules/groups/domain/authz";
import {
  MATCH_ALREADY_STARTED_MESSAGE,
  MATCH_CANCELLED_MESSAGE,
  MATCH_NOT_FOUND_MESSAGE,
} from "@/modules/matches/domain/messages";
import type { MatchRecord } from "@/modules/matches/domain/types";
import type { RsvpsDeps } from "./ports";

export async function assertMatchOpenForRsvp(
  match: MatchRecord,
  now: Date,
): Promise<void> {
  if (match.status === "cancelled") {
    throw new DomainError(DomainErrorCode.CONFLICT, MATCH_CANCELLED_MESSAGE);
  }
  if (match.startAt.getTime() <= now.getTime()) {
    throw new DomainError(
      DomainErrorCode.CONFLICT,
      MATCH_ALREADY_STARTED_MESSAGE,
    );
  }
}

export async function loadMatchForRsvpMember(
  matchId: string,
  actorId: string,
  deps: RsvpsDeps,
): Promise<{ match: MatchRecord }> {
  const match = await deps.matches.findById(matchId);
  if (!match) {
    throw new DomainError(DomainErrorCode.NOT_FOUND, MATCH_NOT_FOUND_MESSAGE);
  }
  requireMember(await deps.memberships.find(match.groupId, actorId));
  return { match };
}
