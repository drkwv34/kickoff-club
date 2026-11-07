import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import type { Sport } from "@/modules/groups/domain/types";
import { loadMatchForOrganizer } from "./access";
import {
  CAPACITY_BELOW_RSVPS_MESSAGE,
  MATCH_ALREADY_STARTED_MESSAGE,
  MATCH_CANCELLED_MESSAGE,
  MATCH_NOT_FOUND_MESSAGE,
} from "./messages";
import type { MatchesDeps } from "./ports";
import { assertEndAfterStart } from "./schedule";
import { toPublicMatch, type MatchRecord, type PublicMatch } from "./types";

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

export type UpdateMatchResult = {
  match: PublicMatch;
  scheduleOrVenueChanged: boolean;
};

function scheduleOrVenueChanged(
  match: MatchRecord,
  input: UpdateMatchInput,
): boolean {
  if (
    input.startAt !== undefined &&
    input.startAt.getTime() !== match.startAt.getTime()
  ) {
    return true;
  }
  if (
    input.endAt !== undefined &&
    input.endAt.getTime() !== match.endAt.getTime()
  ) {
    return true;
  }
  if (input.venue !== undefined && input.venue !== match.venue) {
    return true;
  }
  return false;
}

export async function updateMatch(
  input: UpdateMatchInput,
  deps: MatchesDeps,
): Promise<UpdateMatchResult> {
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

  const patch = {
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
  };

  const notifySchedule = scheduleOrVenueChanged(match, input);
  const nextCapacity = input.capacity;
  if (nextCapacity === undefined) {
    const updated = await deps.matches.update(match.id, patch);
    return {
      match: toPublicMatch(updated),
      scheduleOrVenueChanged: notifySchedule,
    };
  }

  const updated = await deps.runInTransaction(async (stores) => {
    const locked = await stores.matches.findByIdForUpdate(match.id);
    if (!locked) {
      throw new DomainError(DomainErrorCode.NOT_FOUND, MATCH_NOT_FOUND_MESSAGE);
    }
    if (locked.status === "cancelled") {
      throw new DomainError(DomainErrorCode.CONFLICT, MATCH_CANCELLED_MESSAGE);
    }
    if (locked.startAt.getTime() <= now.getTime()) {
      throw new DomainError(
        DomainErrorCode.CONFLICT,
        MATCH_ALREADY_STARTED_MESSAGE,
      );
    }

    const goingCount = await stores.rsvps.countGoing(locked.id);
    if (nextCapacity < goingCount) {
      throw new DomainError(
        DomainErrorCode.CAPACITY_BELOW_RSVPS,
        CAPACITY_BELOW_RSVPS_MESSAGE,
      );
    }

    return stores.matches.update(locked.id, patch);
  });

  return {
    match: toPublicMatch(updated),
    scheduleOrVenueChanged: notifySchedule,
  };
}
