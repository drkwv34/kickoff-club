import type {
  NotificationPreferenceRecord,
  NotificationRecord,
  NotificationType,
} from "./types";

export type NotificationRepository = {
  create(input: {
    userId: string;
    type: NotificationType;
    payloadJson: Record<string, unknown>;
    createdAt: Date;
  }): Promise<NotificationRecord>;
  listByUserId(userId: string, limit: number): Promise<NotificationRecord[]>;
  countUnread(userId: string): Promise<number>;
  markRead(ids: string[], userId: string, readAt: Date): Promise<number>;
  markAllRead(userId: string, readAt: Date): Promise<number>;
};

export type NotificationPreferenceRepository = {
  listByUserId(userId: string): Promise<NotificationPreferenceRecord[]>;
  findByUserAndType(
    userId: string,
    type: NotificationType,
  ): Promise<NotificationPreferenceRecord | null>;
  upsert(input: {
    userId: string;
    type: NotificationType;
    inApp: boolean;
    email: boolean;
    updatedAt: Date;
  }): Promise<NotificationPreferenceRecord>;
};

export type NotificationMailTemplate =
  | "invite_received"
  | "rsvp_confirmed"
  | "waitlist_promoted"
  | "match_cancelled"
  | "no_show_marked"
  | "match_updated"
  | "password_reset";

export type NotificationMailer = {
  send(input: {
    template: NotificationMailTemplate;
    to: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
};

export type NotificationsDeps = {
  notifications: NotificationRepository;
  preferences: NotificationPreferenceRepository;
  mailer: NotificationMailer;
  resolveUserEmail: (userId: string) => Promise<string | null>;
  clock: () => Date;
};
