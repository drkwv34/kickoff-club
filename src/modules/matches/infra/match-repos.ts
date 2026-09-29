import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { matches } from "@/lib/db/schema";
import { mapUnknownError } from "@/lib/errors/domain-error";
import type { MatchRepository } from "../domain/ports";
import type { Sport } from "@/modules/groups/domain/types";
import type { MatchRecord, MatchStatus } from "../domain/types";

type Db = ReturnType<typeof getDb>;

function toMatch(row: typeof matches.$inferSelect): MatchRecord {
  return {
    id: row.id,
    groupId: row.groupId,
    seriesId: row.seriesId,
    title: row.title,
    sport: row.sport as Sport,
    venue: row.venue,
    startAt: row.startAt,
    endAt: row.endAt,
    timezone: row.timezone,
    capacity: row.capacity,
    description: row.description,
    status: row.status as MatchStatus,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createMatchRepository(db: Db): MatchRepository {
  return {
    async create(input) {
      try {
        const [row] = await db
          .insert(matches)
          .values({
            groupId: input.groupId,
            seriesId: input.seriesId,
            title: input.title,
            sport: input.sport,
            venue: input.venue,
            startAt: input.startAt,
            endAt: input.endAt,
            timezone: input.timezone,
            capacity: input.capacity,
            description: input.description,
            createdBy: input.createdBy,
          })
          .returning();
        if (!row) throw new Error("insert matches returned no row");
        return toMatch(row);
      } catch (err) {
        throw mapUnknownError(err);
      }
    },

    async createMany(inputs) {
      if (inputs.length === 0) {
        return [];
      }
      try {
        const rows = await db
          .insert(matches)
          .values(
            inputs.map((input) => ({
              groupId: input.groupId,
              seriesId: input.seriesId,
              title: input.title,
              sport: input.sport,
              venue: input.venue,
              startAt: input.startAt,
              endAt: input.endAt,
              timezone: input.timezone,
              capacity: input.capacity,
              description: input.description,
              createdBy: input.createdBy,
            })),
          )
          .returning();
        return rows.map(toMatch);
      } catch (err) {
        throw mapUnknownError(err);
      }
    },

    async findById(id) {
      const [row] = await db
        .select()
        .from(matches)
        .where(eq(matches.id, id))
        .limit(1);
      return row ? toMatch(row) : null;
    },

    async listByGroupId(groupId) {
      const rows = await db
        .select()
        .from(matches)
        .where(eq(matches.groupId, groupId))
        .orderBy(asc(matches.startAt));
      return rows.map(toMatch);
    },

    async listBySeriesId(seriesId) {
      const rows = await db
        .select()
        .from(matches)
        .where(eq(matches.seriesId, seriesId))
        .orderBy(asc(matches.startAt));
      return rows.map(toMatch);
    },

    async cancelScheduledBySeriesId(seriesId, updatedAt) {
      try {
        const rows = await db
          .update(matches)
          .set({ status: "cancelled", updatedAt })
          .where(
            and(eq(matches.seriesId, seriesId), eq(matches.status, "scheduled")),
          )
          .returning();
        return rows.map(toMatch);
      } catch (err) {
        throw mapUnknownError(err);
      }
    },

    async update(id, patch) {
      try {
        const [row] = await db
          .update(matches)
          .set({
            ...(patch.title !== undefined ? { title: patch.title } : {}),
            ...(patch.sport !== undefined ? { sport: patch.sport } : {}),
            ...(patch.venue !== undefined ? { venue: patch.venue } : {}),
            ...(patch.startAt !== undefined ? { startAt: patch.startAt } : {}),
            ...(patch.endAt !== undefined ? { endAt: patch.endAt } : {}),
            ...(patch.timezone !== undefined ? { timezone: patch.timezone } : {}),
            ...(patch.capacity !== undefined ? { capacity: patch.capacity } : {}),
            ...(patch.description !== undefined
              ? { description: patch.description }
              : {}),
            ...(patch.status !== undefined ? { status: patch.status } : {}),
            updatedAt: patch.updatedAt,
          })
          .where(eq(matches.id, id))
          .returning();
        if (!row) throw new Error("update matches returned no row");
        return toMatch(row);
      } catch (err) {
        throw mapUnknownError(err);
      }
    },
  };
}
