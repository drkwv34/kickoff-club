import type { NotificationMailTemplate, NotificationsDeps } from "./ports";
import type { NotificationType } from "./types";

const MAIL_TEMPLATES: Record<NotificationType, NotificationMailTemplate> = {
  invite_received: "invite_received",
  rsvp_confirmed: "rsvp_confirmed",
  waitlist_promoted: "waitlist_promoted",
  match_cancelled: "match_cancelled",
  no_show_marked: "no_show_marked",
};

/**
 * Persists an in-app notification and attempts email delivery (non-blocking for callers).
 */
export async function publishNotification(
  deps: NotificationsDeps,
  input: {
    userId: string;
    type: NotificationType;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  const now = deps.clock();
  await deps.notifications.create({
    userId: input.userId,
    type: input.type,
    payloadJson: input.payload,
    createdAt: now,
  });

  const email = await deps.resolveUserEmail(input.userId);
  if (!email) {
    return;
  }

  try {
    await deps.mailer.send({
      template: MAIL_TEMPLATES[input.type],
      to: email,
      payload: input.payload,
    });
  } catch {
    // Email failures must not roll back in-app notifications (FR-NOTIF-002).
  }
}
