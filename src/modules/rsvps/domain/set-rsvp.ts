import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { MATCH_NOT_FOUND_MESSAGE } from "@/modules/matches/domain/messages";
import {
  assertMatchOpenForRsvp,
  loadMatchForRsvpMember,
} from "./access";
import { fillOpenSpotsFromWaitlist } from "./promote-waitlist";
import type { RsvpStores, RsvpsDeps } from "./ports";
import { toPublicRsvp, type PublicRsvp, type RsvpStatus } from "./types";

export type SetRsvpInput = {
  actorId: string;
  matchId: string;
  status: "going" | "declined";
};

async function resolveGoingStatus(
  matchId: string,
  capacity: number,
  stores: RsvpStores,
): Promise<{ status: RsvpStatus; waitlistPosition: number | null }> {
  const goingCount = await stores.rsvps.countGoing(matchId);
  if (goingCount < capacity) {
    return { status: "going", waitlistPosition: null };
  }
  const position = await stores.rsvps.nextWaitlistPosition(matchId);
  return { status: "waitlisted", waitlistPosition: position };
}

export async function setRsvp(
  input: SetRsvpInput,
  deps: RsvpsDeps,
): Promise<{
  rsvp: PublicRsvp;
  promotedUserIds: string[];
  rsvpConfirmed: boolean;
}> {
  await loadMatchForRsvpMember(input.matchId, input.actorId, deps);

  const { saved, promotedUserIds, rsvpConfirmed } = await deps.runInTransaction(
    async (stores) => {
    const locked = await stores.matches.findByIdForUpdate(input.matchId);
    if (!locked) {
      throw new DomainError(DomainErrorCode.NOT_FOUND, MATCH_NOT_FOUND_MESSAGE);
    }
    const now = deps.clock();
    await assertMatchOpenForRsvp(locked, now);

    const existing = await stores.rsvps.findByMatchAndUser(
      input.matchId,
      input.actorId,
    );

    let promotedUserIds: string[] = [];

    if (input.status === "declined") {
      if (existing?.status === "declined") {
        return {
          saved: existing,
          promotedUserIds: [],
          rsvpConfirmed: false,
        };
      }
      const wasWaitlisted = existing?.status === "waitlisted";
      const wasGoing = existing?.status === "going";
      const saved = await stores.rsvps.save({
        id: existing?.id,
        matchId: input.matchId,
        userId: input.actorId,
        status: "declined",
        waitlistPosition: null,
        updatedAt: now,
        createdAt: existing?.createdAt,
      });
      if (wasWaitlisted) {
        await stores.rsvps.compactWaitlist(input.matchId);
      } else if (wasGoing) {
        promotedUserIds = await fillOpenSpotsFromWaitlist(
          input.matchId,
          locked.capacity,
          stores,
          now,
        );
        await stores.rsvps.compactWaitlist(input.matchId);
      }
      return { saved, promotedUserIds, rsvpConfirmed: false };
    }

    if (existing?.status === "going") {
      return {
        saved: existing,
        promotedUserIds: [],
        rsvpConfirmed: false,
      };
    }
    if (existing?.status === "waitlisted") {
      const goingCount = await stores.rsvps.countGoing(input.matchId);
      if (goingCount >= locked.capacity) {
        return {
          saved: existing,
          promotedUserIds: [],
          rsvpConfirmed: false,
        };
      }
    }

    const { status, waitlistPosition } = await resolveGoingStatus(
      input.matchId,
      locked.capacity,
      stores,
    );

    const wasWaitlisted = existing?.status === "waitlisted";
    const saved = await stores.rsvps.save({
      id: existing?.id,
      matchId: input.matchId,
      userId: input.actorId,
      status,
      waitlistPosition,
      updatedAt: now,
      createdAt: existing?.createdAt,
    });

    if (wasWaitlisted && status === "going") {
      await stores.rsvps.compactWaitlist(input.matchId);
    }

    const rsvpConfirmed = status === "going";

    return { saved, promotedUserIds, rsvpConfirmed };
    },
  );

  return {
    rsvp: toPublicRsvp(saved),
    promotedUserIds,
    rsvpConfirmed,
  };
}
