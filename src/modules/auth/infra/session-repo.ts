import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";
import type { SessionRepository } from "../domain/ports";
import type { SessionRecord } from "../domain/session";
import type { UserRecord } from "../domain/user";

type Db = ReturnType<typeof getDb>;

function toSessionRecord(row: typeof sessions.$inferSelect): SessionRecord {
  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    revokedAt: row.revokedAt ?? null,
  };
}

function toUserRecord(row: typeof users.$inferSelect): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    displayName: row.displayName,
    timezone: row.timezone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createSessionRepository(db: Db): SessionRepository {
  return {
    async create(input) {
      const [row] = await db
        .insert(sessions)
        .values({
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          createdAt: input.createdAt,
        })
        .returning();
      if (!row) {
        throw new Error("insert sessions returned no row");
      }
      return toSessionRecord(row);
    },
    async findActiveByTokenHash(tokenHash, now) {
      const [row] = await db
        .select({ session: sessions, user: users })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(
          and(
            eq(sessions.tokenHash, tokenHash),
            isNull(sessions.revokedAt),
            gt(sessions.expiresAt, now),
          ),
        )
        .limit(1);
      if (!row) return null;
      return {
        session: toSessionRecord(row.session),
        user: toUserRecord(row.user),
      };
    },
    async revoke(id, revokedAt) {
      await db
        .update(sessions)
        .set({ revokedAt })
        .where(and(eq(sessions.id, id), isNull(sessions.revokedAt)));
    },
    async touchExpiry(id, expiresAt) {
      await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
    },
  };
}
