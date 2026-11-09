export const NOTIFICATION_TYPES = [
  "invite_received",
  "rsvp_confirmed",
  "waitlist_promoted",
  "match_cancelled",
  "no_show_marked",
  "match_updated",
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

export type NotificationPreferenceRecord = {
  userId: string;
  type: NotificationType;
  inApp: boolean;
  email: boolean;
  updatedAt: Date;
};

export type PublicNotificationPreference = {
  type: NotificationType;
  inApp: boolean;
  email: boolean;
};

export function defaultPreference(type: NotificationType): PublicNotificationPreference {
  return { type, inApp: true, email: true };
}
