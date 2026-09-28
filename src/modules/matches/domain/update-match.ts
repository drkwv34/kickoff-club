import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import type { Sport } from "@/modules/groups/domain/types";
import { loadMatchForOrganizer } from "./access";
import {
  MATCH_ALREADY_STARTED_MESSAGE,
  MATCH_CANCELLED_MESSAGE,
} from "./messages";
import type { MatchesDeps } from "./ports";
import { assertEndAfterStart } from "./schedule";
import { toPublicMatch, type PublicMatch } from "./types";

export type UpdateMatchInput = {
  actorId: string;
  matchId: string;
  title?: string;
  sport?: Sport;
  venue?: string;
  startAt?: Date;
  endAt?: Date;
  timezone?: string;
  capacity?: number;
  description?: string | null;
};

export async function updateMatch(
  input: UpdateMatchInput,
  deps: MatchesDeps,
): Promise<{ match: PublicMatch }> {
  const { match } = await loadMatchForOrganizer(
    input.matchId,
    input.actorId,
    deps,
  );

  if (match.status === "cancelled") {
    throw new DomainError(DomainErrorCode.CONFLICT, MATCH_CANCELLED_MESSAGE);
  }

  const now = deps.clock();
  if (match.startAt.getTime() <= now.getTime()) {
    throw new DomainError(DomainErrorCode.CONFLICT, MATCH_ALREADY_STARTED_MESSAGE);
  }

  const startAt = input.startAt ?? match.startAt;
  const endAt = input.endAt ?? match.endAt;
  assertEndAfterStart(startAt, endAt);

  const updated = await deps.matches.update(match.id, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.sport !== undefined ? { sport: input.sport } : {}),
    ...(input.venue !== undefined ? { venue: input.venue } : {}),
    ...(input.startAt !== undefined ? { startAt: input.startAt } : {}),
    ...(input.endAt !== undefined ? { endAt: input.endAt } : {}),
    ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    updatedAt: now,
  });

  return { match: toPublicMatch(updated) };
}
