import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { requireMember, requireOrganizer } from "@/modules/groups/domain/authz";
import { GROUP_NOT_FOUND_MESSAGE } from "@/modules/groups/domain/messages";
import type { GroupRecord, MembershipRecord } from "@/modules/groups/domain/types";
import type { MatchesDeps } from "./ports";
import { MATCH_NOT_FOUND_MESSAGE } from "./messages";
import type { MatchRecord } from "./types";

export async function loadGroupForActor(
  groupId: string,
  actorId: string,
  deps: MatchesDeps,
): Promise<{ group: GroupRecord; membership: MembershipRecord }> {
  const group = await deps.groups.findById(groupId);
  if (!group) {
    throw new DomainError(DomainErrorCode.NOT_FOUND, GROUP_NOT_FOUND_MESSAGE);
  }
  const membership = requireMember(
    await deps.memberships.find(groupId, actorId),
  );
  return { group, membership };
}

export async function loadMatchForMember(
  matchId: string,
  actorId: string,
  deps: MatchesDeps,
): Promise<{ match: MatchRecord; membership: MembershipRecord }> {
  const match = await deps.matches.findById(matchId);
  if (!match) {
    throw new DomainError(DomainErrorCode.NOT_FOUND, MATCH_NOT_FOUND_MESSAGE);
  }
  const membership = requireMember(
    await deps.memberships.find(match.groupId, actorId),
  );
  return { match, membership };
}

export async function loadMatchForOrganizer(
  matchId: string,
  actorId: string,
  deps: MatchesDeps,
): Promise<{ match: MatchRecord; membership: MembershipRecord }> {
  const loaded = await loadMatchForMember(matchId, actorId, deps);
  requireOrganizer(loaded.membership);
  return loaded;
}
