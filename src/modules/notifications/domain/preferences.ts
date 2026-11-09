import type { NotificationsDeps } from "./ports";
import {
  defaultPreference,
  NOTIFICATION_TYPES,
  type NotificationType,
  type PublicNotificationPreference,
} from "./types";

export type PreferencePatch = {
  type: NotificationType;
  inApp?: boolean;
  email?: boolean;
};

export async function listNotificationPreferences(
  userId: string,
  deps: NotificationsDeps,
): Promise<{ preferences: PublicNotificationPreference[] }> {
  const rows = await deps.preferences.listByUserId(userId);
  const byType = new Map(rows.map((row) => [row.type, row]));
  return {
    preferences: NOTIFICATION_TYPES.map((type) => {
      const stored = byType.get(type);
      return stored
        ? { type: stored.type, inApp: stored.inApp, email: stored.email }
        : defaultPreference(type);
    }),
  };
}

export async function updateNotificationPreferences(
  userId: string,
  patch: PreferencePatch[],
  deps: NotificationsDeps,
): Promise<{ preferences: PublicNotificationPreference[] }> {
  const now = deps.clock();
  for (const item of patch) {
    const existing = await deps.preferences.findByUserAndType(userId, item.type);
    await deps.preferences.upsert({
      userId,
      type: item.type,
      inApp: item.inApp ?? existing?.inApp ?? true,
      email: item.email ?? existing?.email ?? true,
      updatedAt: now,
    });
  }
  return listNotificationPreferences(userId, deps);
}
