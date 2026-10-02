import type { NotificationsDeps } from "./ports";
import { toPublicNotification } from "./types";

const DEFAULT_LIMIT = 50;

export async function listNotifications(
  userId: string,
  deps: NotificationsDeps,
): Promise<{
  notifications: ReturnType<typeof toPublicNotification>[];
  unreadCount: number;
}> {
  const [rows, unreadCount] = await Promise.all([
    deps.notifications.listByUserId(userId, DEFAULT_LIMIT),
    deps.notifications.countUnread(userId),
  ]);
  return {
    notifications: rows.map(toPublicNotification),
    unreadCount,
  };
}

export async function getUnreadNotificationCount(
  userId: string,
  deps: NotificationsDeps,
): Promise<number> {
  return deps.notifications.countUnread(userId);
}
