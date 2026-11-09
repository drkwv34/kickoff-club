import { getDb } from "@/lib/db/client";
import { createUserRepository } from "@/modules/auth/infra/user-repo";
import type { NotificationMailer, NotificationsDeps } from "./domain/ports";
import { createNotificationRepository } from "./infra/notification-repos";
import { createNotificationPreferenceRepository } from "./infra/preference-repos";
import { createSmtpNotificationMailer } from "./infra/smtp-mailer";

let cached: NotificationsDeps | null = null;
let mailerForTests: NotificationMailer | null = null;

export function setNotificationsMailerForTests(
  mailer: NotificationMailer | null,
): void {
  mailerForTests = mailer;
  cached = null;
}

export function getNotificationsDeps(): NotificationsDeps {
  if (!cached) {
    const db = getDb();
    const users = createUserRepository(db);
    cached = {
      notifications: createNotificationRepository(db),
      preferences: createNotificationPreferenceRepository(db),
      mailer: mailerForTests ?? createSmtpNotificationMailer(),
      resolveUserEmail: async (userId) => {
        const user = await users.findById(userId);
        return user?.email ?? null;
      },
      clock: () => new Date(),
    };
  }
  return cached;
}

export function resetNotificationsDepsCache(): void {
  cached = null;
}
