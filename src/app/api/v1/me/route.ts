import { NextResponse } from "next/server";
import { applySessionCookie, requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";
import { SESSION_COOKIE_NAME, readCookie } from "@/lib/http/cookies";
import { getAuthDeps } from "@/modules/auth/composition";
import { updateProfile } from "@/modules/auth/domain/update-profile";
import {
  updateProfileBodySchema,
  validationErrorFromZod,
} from "@/modules/auth/validation";

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

export async function PATCH(request: Request): Promise<Response> {
  return handleApi(request, "PATCH /api/v1/me", async ({ logger }) => {
    assertCsrf(request);
    const session = await requireSession(request);
    const parsed = updateProfileBodySchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const user = await updateProfile(
      {
        userId: session.user.id,
        ...(parsed.data.displayName !== undefined
          ? { displayName: parsed.data.displayName }
          : {}),
        ...(parsed.data.timezone !== undefined
          ? { timezone: parsed.data.timezone }
          : {}),
      },
      getAuthDeps(),
    );
    logger.info("profile updated", { userId: user.id });

    const response = NextResponse.json({ user }, { status: 200 });
    const token = readCookie(request, SESSION_COOKIE_NAME);
    if (token) {
      applySessionCookie(response.headers, token, session.expiresAt);
    }
    return response;
  });
}
