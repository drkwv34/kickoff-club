import { NextResponse } from "next/server";
import { applySessionCookie, requireSession } from "@/lib/http/auth-cookies";
import { handleApi } from "@/lib/http/handle-api";
import { SESSION_COOKIE_NAME, readCookie } from "@/lib/http/cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleApi(request, "GET /api/v1/me", async ({ logger }) => {
    const session = await requireSession(request);
    logger.info("me", { userId: session.user.id });

    const response = NextResponse.json({ user: session.user });
    const token = readCookie(request, SESSION_COOKIE_NAME);
    if (token) {
      applySessionCookie(response.headers, token, session.expiresAt);
    }
    return response;
  });
}
