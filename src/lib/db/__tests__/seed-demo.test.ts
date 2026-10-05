import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDb } from "../client";
import {
  DEMO_GROUP_ID,
  DEMO_MATCH_ID,
  DEMO_ORGANIZER_EMAIL,
  DEMO_PLAYER_EMAIL,
  runDemoSeed,
} from "../seed-demo";
import { groupMemberships, groups, matches, users } from "../schema";
import { ensureTestSchema, getTestSql } from "../test-helpers";

describe("demo seed", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  afterAll(async () => {
    const sql = await getTestSql();
    await sql`DELETE FROM rsvps WHERE match_id = ${DEMO_MATCH_ID}::uuid`;
    await sql`DELETE FROM matches WHERE id = ${DEMO_MATCH_ID}::uuid`;
    await sql`DELETE FROM group_memberships WHERE group_id = ${DEMO_GROUP_ID}::uuid`;
    await sql`DELETE FROM groups WHERE id = ${DEMO_GROUP_ID}::uuid`;
    await sql`DELETE FROM users WHERE email IN (${DEMO_ORGANIZER_EMAIL}, ${DEMO_PLAYER_EMAIL})`;
  });

  it("runs twice without duplicate demo entities", async () => {
    const first = await runDemoSeed();
    const second = await runDemoSeed();

    expect(second.organizerId).toBe(first.organizerId);
    expect(second.playerId).toBe(first.playerId);
    expect(second.groupId).toBe(first.groupId);
    expect(second.matchId).toBe(first.matchId);

    const db = getDb();
    const demoUsers = await db
      .select({ email: users.email })
      .from(users)
      .where(
        inArray(users.email, [DEMO_ORGANIZER_EMAIL, DEMO_PLAYER_EMAIL]),
      );
    expect(demoUsers).toHaveLength(2);

    const demoGroups = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.id, DEMO_GROUP_ID));
    expect(demoGroups).toHaveLength(1);

    const demoMatches = await db
      .select({ id: matches.id, startAt: matches.startAt })
      .from(matches)
      .where(eq(matches.id, DEMO_MATCH_ID));
    expect(demoMatches).toHaveLength(1);
    expect(demoMatches[0].startAt.getTime()).toBeGreaterThan(Date.now());

    const memberships = await db
      .select({ role: groupMemberships.role })
      .from(groupMemberships)
      .where(eq(groupMemberships.groupId, DEMO_GROUP_ID));
    expect(memberships.map((row) => row.role).sort()).toEqual([
      "organizer",
      "player",
    ]);
  });
});
