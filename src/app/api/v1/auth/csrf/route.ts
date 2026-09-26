import { NextResponse } from "next/server";
import { handleApi } from "@/lib/http/handle-api";
import { applyCsrfCookie, issueCsrfToken, readOrCreateCsrfToken } from "@/lib/http/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleApi(request, "GET /api/v1/auth/csrf", async () => {
    const headers = new Headers();
    const csrfToken = readOrCreateCsrfToken(request, headers);
    const response = NextResponse.json({ csrfToken });
    const issued = headers.getSetCookie();
    for (const cookie of issued) {
      response.headers.append("Set-Cookie", cookie);
    }
    if (issued.length === 0) {
      applyCsrfCookie(response.headers, csrfToken || issueCsrfToken());
    }
    return response;
  });
}
