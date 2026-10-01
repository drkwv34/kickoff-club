import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { rsvps } from "@/lib/db/schema";
import { mapUnknownError } from "@/lib/errors/domain-error";
import type { RsvpRepository } from "../domain/ports";
import type { RsvpRecord, RsvpStatus } from "../domain/types";

type Db = ReturnType<typeof getDb>;

function toRsvp(row: typeof rsvps.$inferSelect): RsvpRecord {
  return {
    id: row.id,
    matchId: row.matchId,
    userId: row.userId,
    status: row.status as RsvpStatus,
    waitlistPosition: row.waitlistPosition,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createRsvpRepository(db: Db): RsvpRepository {
  return {
    async findByMatchAndUser(matchId, userId) {
      const [row] = await db
        .select()
        .from(rsvps)
        .where(and(eq(rsvps.matchId, matchId), eq(rsvps.userId, userId)))
        .limit(1);
      return row ? toRsvp(row) : null;
    },

    async countGoing(matchId) {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(rsvps)
        .where(and(eq(rsvps.matchId, matchId), eq(rsvps.status, "going")));
      return row?.count ?? 0;
    },

    async nextWaitlistPosition(matchId) {
      const [row] = await db
        .select({
          maxPos: sql<number>`coalesce(max(${rsvps.waitlistPosition}), 0)::int`,
        })
        .from(rsvps)
        .where(
          and(eq(rsvps.matchId, matchId), eq(rsvps.status, "waitlisted")),
        );
      return (row?.maxPos ?? 0) + 1;
    },

    async save(input) {
      try {
        if (input.id) {
          const [row] = await db
            .update(rsvps)
            .set({
              status: input.status,
              waitlistPosition: input.waitlistPosition,
              updatedAt: input.updatedAt,
            })
            .where(eq(rsvps.id, input.id))
            .returning();
          if (!row) throw new Error("update rsvps returned no row");
          return toRsvp(row);
        }
        const [row] = await db
          .insert(rsvps)
          .values({
            matchId: input.matchId,
            userId: input.userId,
            status: input.status,
            waitlistPosition: input.waitlistPosition,
            updatedAt: input.updatedAt,
          })
          .returning();
        if (!row) throw new Error("insert rsvps returned no row");
        return toRsvp(row);
      } catch (err) {
        throw mapUnknownError(err);
      }
    },

    async compactWaitlist(matchId) {
      const rows = await db
        .select()
        .from(rsvps)
        .where(
          and(eq(rsvps.matchId, matchId), eq(rsvps.status, "waitlisted")),
        )
        .orderBy(asc(rsvps.waitlistPosition), asc(rsvps.createdAt));

      let position = 1;
      for (const row of rows) {
        if (row.waitlistPosition !== position) {
          await db
            .update(rsvps)
            .set({ waitlistPosition: position })
            .where(eq(rsvps.id, row.id));
        }
        position += 1;
      }
    },

    async promoteEarliestWaitlisted(matchId, updatedAt) {
      const [row] = await db
        .select()
        .from(rsvps)
        .where(
          and(eq(rsvps.matchId, matchId), eq(rsvps.status, "waitlisted")),
        )
        .orderBy(asc(rsvps.waitlistPosition), asc(rsvps.createdAt))
        .limit(1)
        .for("update");

      if (!row) {
        return null;
      }

      const [updated] = await db
        .update(rsvps)
        .set({
          status: "going",
          waitlistPosition: null,
          updatedAt,
        })
        .where(eq(rsvps.id, row.id))
        .returning();

      if (!updated) {
        throw new Error("promote waitlist update returned no row");
      }
      return toRsvp(updated);
    },
  };
}
