import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { notificationPreferences } from "@/lib/db/schema";
import { mapUnknownError } from "@/lib/errors/domain-error";
import type { NotificationPreferenceRepository } from "../domain/ports";
import type {
  NotificationPreferenceRecord,
  NotificationType,
} from "../domain/types";

type Db = ReturnType<typeof getDb>;

function toRecord(
  row: typeof notificationPreferences.$inferSelect,
): NotificationPreferenceRecord {
  return {
    userId: row.userId,
    type: row.type as NotificationType,
    inApp: row.inApp,
    email: row.email,
    updatedAt: row.updatedAt,
  };
}

export function createNotificationPreferenceRepository(
  db: Db,
): NotificationPreferenceRepository {
  return {
    async listByUserId(userId) {
      const rows = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
      return rows.map(toRecord);
    },
    async findByUserAndType(userId, type) {
      const [row] = await db
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.userId, userId),
            eq(notificationPreferences.type, type),
          ),
        )
        .limit(1);
      return row ? toRecord(row) : null;
    },
    async upsert(input) {
      try {
        const [row] = await db
          .insert(notificationPreferences)
          .values({
            userId: input.userId,
            type: input.type,
            inApp: input.inApp,
            email: input.email,
            updatedAt: input.updatedAt,
          })
          .onConflictDoUpdate({
            target: [
              notificationPreferences.userId,
              notificationPreferences.type,
            ],
            set: {
              inApp: input.inApp,
              email: input.email,
              updatedAt: input.updatedAt,
            },
          })
          .returning();
        if (!row) throw new Error("upsert notification_preferences returned no row");
        return toRecord(row);
      } catch (err) {
        throw mapUnknownError(err);
      }
    },
  };
}
