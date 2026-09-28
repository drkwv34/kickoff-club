import { loadMatchForMember } from "./access";
import type { MatchesDeps } from "./ports";
import { toPublicMatch, type PublicMatch } from "./types";

export async function getMatchDetail(
  matchId: string,
  actorId: string,
  deps: MatchesDeps,
): Promise<{ match: PublicMatch }> {
  const { match } = await loadMatchForMember(matchId, actorId, deps);
  return { match: toPublicMatch(match) };
}
