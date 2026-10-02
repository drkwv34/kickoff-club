import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { WAITLIST_PROMOTION_INVARIANT_MESSAGE } from "./messages";
import type { RsvpStores } from "./ports";

/**
 * Promotes waitlisted RSVPs while going_count < capacity.
 * Caller must hold a transaction and have locked the match row.
 */
export async function fillOpenSpotsFromWaitlist(
  matchId: string,
  capacity: number,
  stores: RsvpStores,
  now: Date,
): Promise<string[]> {
  const promotedUserIds: string[] = [];
  for (;;) {
    const goingCount = await stores.rsvps.countGoing(matchId);
    if (goingCount >= capacity) {
      return promotedUserIds;
    }

    const promoted = await stores.rsvps.promoteEarliestWaitlisted(
      matchId,
      now,
    );
    if (!promoted) {
      return promotedUserIds;
    }
    promotedUserIds.push(promoted.userId);

    const afterCount = await stores.rsvps.countGoing(matchId);
    if (afterCount > capacity) {
      throw new DomainError(
        DomainErrorCode.CONFLICT,
        WAITLIST_PROMOTION_INVARIANT_MESSAGE,
      );
    }
  }
}
