import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { matchSeries } from "@/lib/db/schema";
import { mapUnknownError } from "@/lib/errors/domain-error";
import type { SeriesRepository } from "../domain/ports";
import type { SeriesRecord, WeeklyRecurrenceRule } from "../domain/series-types";

type Db = ReturnType<typeof getDb>;

function toSeries(row: typeof matchSeries.$inferSelect): SeriesRecord {
  return {
    id: row.id,
    groupId: row.groupId,
    rruleJson: row.rruleJson as WeeklyRecurrenceRule,
    createdAt: row.createdAt,
  };
}

export function createSeriesRepository(db: Db): SeriesRepository {
  return {
    async create(input) {
      try {
        const [row] = await db
          .insert(matchSeries)
          .values({
            groupId: input.groupId,
            rruleJson: input.rruleJson,
          })
          .returning();
        if (!row) throw new Error("insert match_series returned no row");
        return toSeries(row);
      } catch (err) {
        throw mapUnknownError(err);
      }
    },

    async findById(id) {
      const [row] = await db
        .select()
        .from(matchSeries)
        .where(eq(matchSeries.id, id))
        .limit(1);
      return row ? toSeries(row) : null;
    },
  };
}
