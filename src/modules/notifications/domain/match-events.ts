import { getMatchesDeps } from "@/modules/matches/composition";
import type { NotificationsDeps } from "./ports";
import { publishNotification } from "./publish";

export async function notifyWaitlistPromoted(
  userId: string,
  matchId: string,
  deps: NotificationsDeps,
): Promise<void> {
  const match = await getMatchesDeps().matches.findById(matchId);
  if (!match) return;
  await publishNotification(deps, {
    userId,
    type: "waitlist_promoted",
    payload: {
      matchId,
      matchTitle: match.title,
      groupId: match.groupId,
    },
  });
}

export async function notifyRsvpConfirmed(
  userId: string,
  matchId: string,
  deps: NotificationsDeps,
): Promise<void> {
  const match = await getMatchesDeps().matches.findById(matchId);
  if (!match) return;
  await publishNotification(deps, {
    userId,
    type: "rsvp_confirmed",
    payload: {
      matchId,
      matchTitle: match.title,
      groupId: match.groupId,
    },
  });
}

export async function notifyMatchCancelled(
  userId: string,
  matchId: string,
  matchTitle: string,
  groupId: string,
  deps: NotificationsDeps,
): Promise<void> {
  await publishNotification(deps, {
    userId,
    type: "match_cancelled",
    payload: { matchId, matchTitle, groupId },
  });
}

export async function notifyInviteReceived(
  userId: string,
  groupId: string,
  groupName: string,
  deps: NotificationsDeps,
): Promise<void> {
  await publishNotification(deps, {
    userId,
    type: "invite_received",
    payload: { groupId, groupName },
  });
}

export async function notifyNoShowMarked(
  userId: string,
  matchId: string,
  matchTitle: string,
  deps: NotificationsDeps,
): Promise<void> {
  await publishNotification(deps, {
    userId,
    type: "no_show_marked",
    payload: { matchId, matchTitle },
  });
}

export async function notifyPromotedUsers(
  matchId: string,
  userIds: string[],
  deps: NotificationsDeps,
): Promise<void> {
  for (const userId of userIds) {
    await notifyWaitlistPromoted(userId, matchId, deps);
  }
}
