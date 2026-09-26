import { NextResponse } from "next/server";
import { getAuthDeps } from "@/modules/auth/composition";
import { loginUser } from "@/modules/auth/domain/login";
import { loginBodySchema, validationErrorFromZod } from "@/modules/auth/validation";
import { applyAuthCookies } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleApi(request, "POST /api/v1/auth/login", async ({ logger }) => {
    assertCsrf(request);
    const parsed = loginBodySchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const result = await loginUser(parsed.data, getAuthDeps());
    logger.info("user signed in", { userId: result.user.id });

    const response = NextResponse.json({ user: result.user }, { status: 200 });
    applyAuthCookies(response.headers, result.sessionToken, result.expiresAt);
    return response;
  });
}
