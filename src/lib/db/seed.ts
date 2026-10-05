import { config } from "dotenv";
import { loadEnv, resetEnvCache } from "../config/env";
import { runDemoSeed } from "./seed-demo";

async function main(): Promise<void> {
  config();
  resetEnvCache();
  loadEnv();

  const summary = await runDemoSeed();

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "demo seed applied",
      route: "db:seed",
      groupId: summary.groupId,
      matchId: summary.matchId,
      matchStartAt: summary.matchStartAt.toISOString(),
    }),
  );
}

main().catch((err: unknown) => {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      message: err instanceof Error ? err.message : "seed failed",
    }),
  );
  process.exit(1);
});
