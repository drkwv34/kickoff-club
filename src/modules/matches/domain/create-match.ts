import { requireOrganizer } from "@/modules/groups/domain/authz";
import type { Sport } from "@/modules/groups/domain/types";
import { assertEndAfterStart } from "./schedule";
import { loadGroupForActor } from "./access";
import type { MatchesDeps } from "./ports";
import { toPublicMatch, type PublicMatch } from "./types";

export type CreateMatchInput = {
  actorId: string;
  groupId: string;
  title: string;
  sport: Sport;
  venue: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  capacity: number;
  description: string | null;
};

export async function createMatch(
  input: CreateMatchInput,
  deps: MatchesDeps,
): Promise<{ match: PublicMatch }> {
  const { group, membership } = await loadGroupForActor(
    input.groupId,
    input.actorId,
    deps,
  );
  requireOrganizer(membership);

  assertEndAfterStart(input.startAt, input.endAt);

  const match = await deps.matches.create({
    groupId: group.id,
    seriesId: null,
    title: input.title,
    sport: input.sport,
    venue: input.venue,
    startAt: input.startAt,
    endAt: input.endAt,
    timezone: input.timezone,
    capacity: input.capacity,
    description: input.description,
    createdBy: input.actorId,
  });

  return { match: toPublicMatch(match) };
}
