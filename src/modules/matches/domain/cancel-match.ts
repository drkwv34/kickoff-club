import { loadMatchForOrganizer } from "./access";
import type { MatchesDeps } from "./ports";
import { toPublicMatch, type PublicMatch } from "./types";

export async function cancelMatch(
  matchId: string,
  actorId: string,
  deps: MatchesDeps,
): Promise<{ match: PublicMatch }> {
  const { match } = await loadMatchForOrganizer(matchId, actorId, deps);

  if (match.status === "cancelled") {
    return { match: toPublicMatch(match) };
  }

  const updated = await deps.matches.update(match.id, {
    status: "cancelled",
    updatedAt: deps.clock(),
  });

  return { match: toPublicMatch(updated) };
}
