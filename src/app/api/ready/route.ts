import { NextResponse } from "next/server";
import { pingDatabase } from "@/lib/db/client";
import { createLogger, newRequestId } from "@/lib/logging/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Readiness: Postgres ping (migrations must have been applied for a useful app). */
export async function GET() {
  const requestId = newRequestId();
  const logger = createLogger({ requestId, route: "GET /api/ready" });
  const started = Date.now();
  try {
    await pingDatabase();
    logger.info("ready", { durationMs: Date.now() - started });
    return NextResponse.json({ status: "ready", checks: { database: "ok" } });
  } catch {
    logger.error("database not ready", { durationMs: Date.now() - started });
    return NextResponse.json(
      { status: "not_ready", checks: { database: "error" } },
      { status: 503 },
    );
  }
}
