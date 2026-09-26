import type { AuthDeps } from "./ports";

export async function logoutSession(
  sessionId: string,
  deps: Pick<AuthDeps, "sessions" | "clock">,
): Promise<void> {
  await deps.sessions.revoke(sessionId, deps.clock());
}
