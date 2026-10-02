import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { noShows } from "@/lib/db/schema";
import { mapUnknownError } from "@/lib/errors/domain-error";
import type { NoShowRecord, NoShowRepository } from "../domain/ports";

type Db = ReturnType<typeof getDb>;

function toRecord(row: typeof noShows.$inferSelect): NoShowRecord {
  return {
    id: row.id,
    matchId: row.matchId,
    userId: row.userId,
    markedBy: row.markedBy,
    markedAt: row.markedAt,
  };
}

export function createNoShowRepository(db: Db): NoShowRepository {
  return {
    async findByMatchAndUser(matchId, userId) {
      const [row] = await db
        .select()
        .from(noShows)
        .where(and(eq(noShows.matchId, matchId), eq(noShows.userId, userId)))
        .limit(1);
      return row ? toRecord(row) : null;
    },
    async create(input) {
      try {
        const [row] = await db
          .insert(noShows)
          .values({
            matchId: input.matchId,
            userId: input.userId,
            markedBy: input.markedBy,
            markedAt: input.markedAt,
          })
          .returning();
        if (!row) throw new Error("insert no_shows returned no row");
        return toRecord(row);
      } catch (err) {
        throw mapUnknownError(err);
      }
    },
  };
}
