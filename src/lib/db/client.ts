import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { loadEnv } from "@/lib/config/env";
import * as schema from "./schema";

type Sql = ReturnType<typeof postgres>;
type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  kickoffSql?: Sql;
  kickoffDb?: Db;
};

function getSql(): Sql {
  if (!globalForDb.kickoffSql) {
    const env = loadEnv();
    globalForDb.kickoffSql = postgres(env.DATABASE_URL, { max: 10 });
  }
  return globalForDb.kickoffSql;
}

/** Lazy Drizzle client (Node runtime). Do not import from client components. */
export function getDb(): Db {
  if (!globalForDb.kickoffDb) {
    globalForDb.kickoffDb = drizzle(getSql(), { schema });
  }
  return globalForDb.kickoffDb;
}

export async function pingDatabase(): Promise<void> {
  const sql = getSql();
  await sql`select 1`;
}
