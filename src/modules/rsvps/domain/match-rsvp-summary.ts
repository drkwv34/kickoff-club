import { loadMatchForRsvpMember } from "./access";
import type { RsvpsDeps } from "./ports";
import { toPublicRsvp, type PublicRsvp } from "./types";

export async function getMatchRsvpSummary(
  matchId: string,
  actorId: string,
  deps: RsvpsDeps,
): Promise<{ goingCount: number; viewerRsvp: PublicRsvp | null }> {
  await loadMatchForRsvpMember(matchId, actorId, deps);
  const [goingCount, viewer] = await Promise.all([
    deps.rsvps.countGoing(matchId),
    deps.rsvps.findByMatchAndUser(matchId, actorId),
  ]);
  return {
    goingCount,
    viewerRsvp: viewer ? toPublicRsvp(viewer) : null,
  };
}
