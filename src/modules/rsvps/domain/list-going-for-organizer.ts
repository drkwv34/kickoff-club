import { requireMember, requireOrganizer } from "@/modules/groups/domain/authz";
import type { RsvpsDeps } from "./ports";
import { loadMatchForRsvpMember } from "./access";

export async function listGoingUserIdsForOrganizer(
  matchId: string,
  actorId: string,
  deps: RsvpsDeps,
): Promise<string[]> {
  const { match } = await loadMatchForRsvpMember(matchId, actorId, deps);
  const membership = requireMember(
    await deps.memberships.find(match.groupId, actorId),
  );
  requireOrganizer(membership);
  return deps.rsvps.listUserIdsByMatchWithStatuses(matchId, ["going"]);
}
