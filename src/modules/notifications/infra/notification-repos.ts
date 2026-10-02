import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { mapUnknownError } from "@/lib/errors/domain-error";
import type { NotificationRepository } from "../domain/ports";
import type { NotificationRecord, NotificationType } from "../domain/types";

type Db = ReturnType<typeof getDb>;

function toRecord(row: typeof notifications.$inferSelect): NotificationRecord {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as NotificationType,
    payloadJson: row.payloadJson as Record<string, unknown>,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

export function createNotificationRepository(db: Db): NotificationRepository {
  return {
    async create(input) {
      try {
        const [row] = await db
          .insert(notifications)
          .values({
            userId: input.userId,
            type: input.type,
            payloadJson: input.payloadJson,
            createdAt: input.createdAt,
          })
          .returning();
        if (!row) throw new Error("insert notifications returned no row");
        return toRecord(row);
      } catch (err) {
        throw mapUnknownError(err);
      }
    },
    async listByUserId(userId, limit) {
      const rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
      return rows.map(toRecord);
    },
    async countUnread(userId) {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(
          and(eq(notifications.userId, userId), isNull(notifications.readAt)),
        );
      return row?.count ?? 0;
    },
    async markRead(ids, userId, readAt) {
      const rows = await db
        .update(notifications)
        .set({ readAt })
        .where(
          and(
            eq(notifications.userId, userId),
            inArray(notifications.id, ids),
            isNull(notifications.readAt),
          ),
        )
        .returning({ id: notifications.id });
      return rows.length;
    },
    async markAllRead(userId, readAt) {
      const rows = await db
        .update(notifications)
        .set({ readAt })
        .where(
          and(eq(notifications.userId, userId), isNull(notifications.readAt)),
        )
        .returning({ id: notifications.id });
      return rows.length;
    },
  };
}
