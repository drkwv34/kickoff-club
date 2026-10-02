export const NOTIFICATION_TYPES = [
  "invite_received",
  "rsvp_confirmed",
  "waitlist_promoted",
  "match_cancelled",
  "no_show_marked",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationRecord = {
  id: string;
  userId: string;
  type: NotificationType;
  payloadJson: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
};

export type PublicNotification = {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export function toPublicNotification(row: NotificationRecord): PublicNotification {
  return {
    id: row.id,
    type: row.type,
    payload: row.payloadJson,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}
