import { NextResponse } from "next/server";
import { applySessionCookie, requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";
import { SESSION_COOKIE_NAME, readCookie } from "@/lib/http/cookies";
import {
  getNotificationsDeps,
  listNotificationPreferences,
  updateNotificationPreferences,
} from "@/modules/notifications";
import {
  updateNotificationPreferencesBodySchema,
  validationErrorFromZod,
} from "@/modules/notifications/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleApi(
    request,
    "GET /api/v1/me/notification-preferences",
    async ({ logger }) => {
      const session = await requireSession(request);
      const result = await listNotificationPreferences(
        session.user.id,
        getNotificationsDeps(),
      );
      logger.info("notification preferences listed", {
        userId: session.user.id,
      });

      const response = NextResponse.json(result);
      const token = readCookie(request, SESSION_COOKIE_NAME);
      if (token) {
        applySessionCookie(response.headers, token, session.expiresAt);
      }
      return response;
    },
  );
}

export async function PATCH(request: Request): Promise<Response> {
  return handleApi(
    request,
    "PATCH /api/v1/me/notification-preferences",
    async ({ logger }) => {
      assertCsrf(request);
      const session = await requireSession(request);
      const parsed = updateNotificationPreferencesBodySchema.safeParse(
        await parseJsonBody(request),
      );
      if (!parsed.success) {
        throw validationErrorFromZod(parsed.error);
      }

      const result = await updateNotificationPreferences(
        session.user.id,
        parsed.data.preferences,
        getNotificationsDeps(),
      );
      logger.info("notification preferences updated", {
        userId: session.user.id,
        count: parsed.data.preferences.length,
      });

      const response = NextResponse.json(result, { status: 200 });
      const token = readCookie(request, SESSION_COOKIE_NAME);
      if (token) {
        applySessionCookie(response.headers, token, session.expiresAt);
      }
      return response;
    },
  );
}
