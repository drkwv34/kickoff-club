import { NextResponse } from "next/server";

/** Readiness stub — DB check added when migrations land (Day 2+). */
export async function GET() {
  return NextResponse.json({ status: "ready", checks: { database: "skipped" } });
}
