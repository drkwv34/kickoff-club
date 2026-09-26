import { NextResponse } from "next/server";
import { getAuthDeps } from "@/modules/auth/composition";
import { registerUser } from "@/modules/auth/domain/register";
import {
  registerBodySchema,
  validationErrorFromZod,
} from "@/modules/auth/validation";
import { applyAuthCookies } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleApi(request, "POST /api/v1/auth/register", async ({ logger }) => {
    assertCsrf(request);
    const parsed = registerBodySchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const result = await registerUser(parsed.data, getAuthDeps());
    logger.info("user registered", { userId: result.user.id });

    const response = NextResponse.json({ user: result.user }, { status: 201 });
    applyAuthCookies(response.headers, result.sessionToken, result.expiresAt);
    return response;
  });
}
