import { cookies } from "next/headers";
import { getAuthDeps } from "@/modules/auth/composition";
import { resolveSession } from "@/modules/auth/domain/resolve-session";
import type { PublicUser } from "@/modules/auth/domain/user";
import { SESSION_COOKIE_NAME } from "./cookies";

export async function getServerSession(): Promise<{
  sessionId: string;
  user: PublicUser;
} | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const resolved = await resolveSession(token, getAuthDeps());
  if (!resolved) return null;
  return { sessionId: resolved.session.id, user: resolved.user };
}
