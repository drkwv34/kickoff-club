import { config } from "dotenv";
import postgres from "postgres";
import { loadEnv, resetEnvCache } from "../config/env";
import { CORE_TABLES } from "./schema";

async function main(): Promise<void> {
  config();
  resetEnvCache();

  const env = loadEnv();
  const sql = postgres(env.DATABASE_URL, { max: 1 });

  const rows = await sql<{ table_name: string }[]>`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
  `;

  await sql.end();

  const present = new Set(rows.map((r) => r.table_name));
  const missing = CORE_TABLES.filter((name) => !present.has(name));

  if (missing.length > 0) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "schema verification failed",
        missing,
      }),
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "schema verification ok",
      tables: [...CORE_TABLES],
    }),
  );
}

main().catch((err: unknown) => {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      message: err instanceof Error ? err.message : "verify failed",
    }),
  );
  process.exit(1);
});
