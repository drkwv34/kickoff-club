import { NextResponse } from "next/server";
import { getAuthDeps } from "@/modules/auth/composition";
import { logoutSession } from "@/modules/auth/domain/logout";
import {
  clearAuthCookies,
  loadSessionFromRequest,
} from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi } from "@/lib/http/handle-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleApi(request, "POST /api/v1/auth/logout", async ({ logger }) => {
    assertCsrf(request);
    const session = await loadSessionFromRequest(request);
    if (session) {
      await logoutSession(session.sessionId, getAuthDeps());
      logger.info("session revoked", { userId: session.user.id });
    }

    const response = new NextResponse(null, { status: 204 });
    clearAuthCookies(response.headers);
    return response;
  });
}
