import { eq } from "drizzle-orm";
import { createArgon2PasswordHasher } from "@/modules/auth/infra/argon2-hasher";
import { instantFromWallClockInZone } from "@/modules/matches/domain/wall-clock";
import { getDb } from "./client";
import {
  groupMemberships,
  groups,
  matches,
  users,
} from "./schema";

/** Documented in README — demo-only password (≥ 12 chars). */
export const DEMO_PASSWORD = "DemoKickoff12!";

export const DEMO_ORGANIZER_EMAIL = "organizer@demo.kickoff.local";
export const DEMO_PLAYER_EMAIL = "player@demo.kickoff.local";

export const DEMO_TIMEZONE = "America/Bogota";

export const DEMO_ORGANIZER_ID = "11111111-1111-4111-8111-111111111001";
export const DEMO_PLAYER_ID = "11111111-1111-4111-8111-111111111002";
export const DEMO_GROUP_ID = "11111111-1111-4111-8111-111111111101";
export const DEMO_MATCH_ID = "11111111-1111-4111-8111-111111111201";

const DEMO_GROUP_NAME = "Saturday Pickup (Demo)";
const MATCH_WALL_START = "18:00";
const MATCH_WALL_END = "20:00";
const MIN_DAYS_AHEAD = 3;

function weekdayInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).format(date);
}

function dateInZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const year = Number(lookup.year);
  const month = Number(lookup.month);
  const day = Number(lookup.day);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Next Saturday at 18:00–20:00 Bogota, at least MIN_DAYS_AHEAD from `now`. */
export function demoMatchWindow(now: Date = new Date()): {
  startAt: Date;
  endAt: Date;
} {
  let cursor = new Date(now.getTime() + MIN_DAYS_AHEAD * 24 * 60 * 60 * 1000);
  for (let attempt = 0; attempt < 21; attempt++) {
    if (weekdayInZone(cursor, DEMO_TIMEZONE) === "Saturday") {
      const date = dateInZone(cursor, DEMO_TIMEZONE);
      const startAt = instantFromWallClockInZone(
        date,
        MATCH_WALL_START,
        DEMO_TIMEZONE,
      );
      const endAt = instantFromWallClockInZone(
        date,
        MATCH_WALL_END,
        DEMO_TIMEZONE,
      );
      if (startAt.getTime() > now.getTime()) {
        return { startAt, endAt };
      }
    }
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  throw new Error("Could not resolve upcoming demo match window");
}

async function ensureDemoUser(
  db: ReturnType<typeof getDb>,
  hasher: ReturnType<typeof createArgon2PasswordHasher>,
  input: {
    id: string;
    email: string;
    displayName: string;
  },
): Promise<string> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const passwordHash = await hasher.hash(DEMO_PASSWORD);
  await db.insert(users).values({
    id: input.id,
    email: input.email,
    passwordHash,
    displayName: input.displayName,
    timezone: DEMO_TIMEZONE,
  });

  return input.id;
}

export type DemoSeedSummary = {
  organizerId: string;
  playerId: string;
  groupId: string;
  matchId: string;
  matchStartAt: Date;
};

/** Idempotent demo dataset for README / Compose review. */
export async function runDemoSeed(
  now: Date = new Date(),
): Promise<DemoSeedSummary> {
  const db = getDb();
  const hasher = createArgon2PasswordHasher();

  const organizerId = await ensureDemoUser(db, hasher, {
    id: DEMO_ORGANIZER_ID,
    email: DEMO_ORGANIZER_EMAIL,
    displayName: "Demo Organizer",
  });

  const playerId = await ensureDemoUser(db, hasher, {
    id: DEMO_PLAYER_ID,
    email: DEMO_PLAYER_EMAIL,
    displayName: "Demo Player",
  });

  const existingGroup = await db
    .select({ id: groups.id })
    .from(groups)
    .where(eq(groups.id, DEMO_GROUP_ID))
    .limit(1);

  if (existingGroup.length === 0) {
    await db.insert(groups).values({
      id: DEMO_GROUP_ID,
      name: DEMO_GROUP_NAME,
      sportDefault: "futbol",
      homeTimezone: DEMO_TIMEZONE,
      description: "Seeded group for local demos and README walkthroughs.",
      createdBy: organizerId,
    });
  }

  await db
    .insert(groupMemberships)
    .values([
      { groupId: DEMO_GROUP_ID, userId: organizerId, role: "organizer" },
      { groupId: DEMO_GROUP_ID, userId: playerId, role: "player" },
    ])
    .onConflictDoNothing();

  const { startAt, endAt } = demoMatchWindow(now);

  const existingMatch = await db
    .select({ id: matches.id, startAt: matches.startAt })
    .from(matches)
    .where(eq(matches.id, DEMO_MATCH_ID))
    .limit(1);

  if (existingMatch.length === 0) {
    await db.insert(matches).values({
      id: DEMO_MATCH_ID,
      groupId: DEMO_GROUP_ID,
      title: "Demo kickaround",
      sport: "futbol",
      venue: "Parque demo",
      startAt,
      endAt,
      timezone: DEMO_TIMEZONE,
      capacity: 14,
      description: "Sample upcoming match created by pnpm db:seed.",
      status: "scheduled",
      createdBy: organizerId,
    });
  } else if (existingMatch[0].startAt.getTime() <= now.getTime()) {
    await db
      .update(matches)
      .set({ startAt, endAt, updatedAt: now })
      .where(eq(matches.id, DEMO_MATCH_ID));
  }

  return {
    organizerId,
    playerId,
    groupId: DEMO_GROUP_ID,
    matchId: DEMO_MATCH_ID,
    matchStartAt: startAt,
  };
}
