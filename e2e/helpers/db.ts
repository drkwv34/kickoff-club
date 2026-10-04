import postgres from "postgres";

/**
 * Moves match start/end into the past so organizer no-show UI is available.
 * E2e-only; not used in production code paths.
 */
export async function backdateMatchToStarted(matchId: string): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for e2e DB helpers");
  }
  const sql = postgres(url, { max: 1 });
  try {
    await sql`
      UPDATE matches
      SET
        start_at = now() - interval '2 hours',
        end_at = now() - interval '1 hour'
      WHERE id = ${matchId}::uuid
    `;
  } finally {
    await sql.end();
  }
}
