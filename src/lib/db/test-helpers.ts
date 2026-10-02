import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { loadEnv } from "@/lib/config/env";

let migrated = false;
let adminSql: ReturnType<typeof postgres> | null = null;

export async function getTestSql(): Promise<ReturnType<typeof postgres>> {
  if (!adminSql) {
    adminSql = postgres(loadEnv().DATABASE_URL, { max: 1 });
  }
  return adminSql;
}

export async function ensureTestSchema(): Promise<void> {
  if (migrated) return;
  const env = loadEnv();
  const sql = postgres(env.DATABASE_URL, { max: 1 });
  await migrate(drizzle(sql), {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });
  await sql.end();
  migrated = true;
}

export async function resetAuthTables(): Promise<void> {
  const sql = await getTestSql();
  await sql`TRUNCATE TABLE no_shows, notifications, rsvps, matches, match_series, group_invites, group_memberships, groups, sessions, users RESTART IDENTITY CASCADE`;
}
