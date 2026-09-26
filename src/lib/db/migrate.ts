import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";
import postgres from "postgres";
import { loadEnv, resetEnvCache } from "../config/env";

async function main(): Promise<void> {
  config();
  resetEnvCache();

  const env = loadEnv();
  const sql = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await sql.end();

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "migrations applied",
      route: "db:migrate",
    }),
  );
}

main().catch((err: unknown) => {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      message: err instanceof Error ? err.message : "migrate failed",
    }),
  );
  process.exit(1);
});
