import type { NotificationsDeps } from "./ports";

export async function markNotificationsRead(
  userId: string,
  input: { ids?: string[]; all?: boolean },
  deps: NotificationsDeps,
): Promise<{ marked: number }> {
  const readAt = deps.clock();
  if (input.all) {
    const marked = await deps.notifications.markAllRead(userId, readAt);
    return { marked };
  }
  const ids = input.ids ?? [];
  if (ids.length === 0) {
    return { marked: 0 };
  }
  const marked = await deps.notifications.markRead(ids, userId, readAt);
  return { marked };
}
