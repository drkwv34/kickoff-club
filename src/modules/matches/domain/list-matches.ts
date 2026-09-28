import { loadGroupForActor } from "./access";
import type { MatchesDeps } from "./ports";
import { toPublicMatch, type PublicMatch } from "./types";

export async function listMatchesForGroup(
  groupId: string,
  actorId: string,
  deps: MatchesDeps,
): Promise<{ matches: PublicMatch[] }> {
  await loadGroupForActor(groupId, actorId, deps);
  const rows = await deps.matches.listByGroupId(groupId);
  return { matches: rows.map(toPublicMatch) };
}
