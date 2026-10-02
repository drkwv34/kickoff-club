import type { NotificationRecord, NotificationType } from "./types";

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

export type NotificationMailTemplate =
  | "invite_received"
  | "rsvp_confirmed"
  | "waitlist_promoted"
  | "match_cancelled"
  | "no_show_marked";

export type NotificationMailer = {
  send(input: {
    template: NotificationMailTemplate;
    to: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
};

export type NotificationsDeps = {
  notifications: NotificationRepository;
  mailer: NotificationMailer;
  resolveUserEmail: (userId: string) => Promise<string | null>;
  clock: () => Date;
};
