import { getNotificationsDeps } from "../composition";
import {
  notifyPromotedUsers,
  notifyRsvpConfirmed,
} from "./match-events";

export async function handleRsvpNotificationSideEffects(input: {
  matchId: string;
  actorId: string;
  promotedUserIds: string[];
  rsvpConfirmed: boolean;
}): Promise<void> {
  const deps = getNotificationsDeps();
  if (input.rsvpConfirmed) {
    await notifyRsvpConfirmed(input.actorId, input.matchId, deps);
  }
  await notifyPromotedUsers(input.matchId, input.promotedUserIds, deps);
}
