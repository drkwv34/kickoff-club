import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { MATCH_NOT_FOUND_MESSAGE } from "@/modules/matches/domain/messages";
import {
  assertMatchOpenForRsvp,
  loadMatchForRsvpMember,
} from "./access";
import { RSVP_NOT_FOUND_MESSAGE } from "./messages";
import { fillOpenSpotsFromWaitlist } from "./promote-waitlist";
import type { RsvpsDeps } from "./ports";
import { toPublicRsvp, type PublicRsvp } from "./types";

export async function cancelMyRsvp(
  actorId: string,
  matchId: string,
  deps: RsvpsDeps,
): Promise<{ rsvp: PublicRsvp; promotedUserIds: string[] }> {
  await loadMatchForRsvpMember(matchId, actorId, deps);

  const { saved, promotedUserIds } = await deps.runInTransaction(async (stores) => {
    const locked = await stores.matches.findByIdForUpdate(matchId);
    if (!locked) {
      throw new DomainError(DomainErrorCode.NOT_FOUND, MATCH_NOT_FOUND_MESSAGE);
    }
    const now = deps.clock();
    await assertMatchOpenForRsvp(locked, now);

    const existing = await stores.rsvps.findByMatchAndUser(matchId, actorId);
    if (!existing) {
      throw new DomainError(DomainErrorCode.NOT_FOUND, RSVP_NOT_FOUND_MESSAGE);
    }
    if (existing.status === "cancelled") {
      return { saved: existing, promotedUserIds: [] as string[] };
    }

    const wasWaitlisted = existing.status === "waitlisted";
    const wasGoing = existing.status === "going";
    let promotedUserIds: string[] = [];
    const saved = await stores.rsvps.save({
      id: existing.id,
      matchId,
      userId: actorId,
      status: "cancelled",
      waitlistPosition: null,
      updatedAt: now,
      createdAt: existing.createdAt,
    });

    if (wasWaitlisted) {
      await stores.rsvps.compactWaitlist(matchId);
    } else if (wasGoing) {
      promotedUserIds = await fillOpenSpotsFromWaitlist(
        matchId,
        locked.capacity,
        stores,
        now,
      );
      await stores.rsvps.compactWaitlist(matchId);
    }

    return { saved, promotedUserIds };
  });

  return { rsvp: toPublicRsvp(saved), promotedUserIds };
}
