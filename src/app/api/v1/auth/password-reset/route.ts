import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/config/env";
import { applyCsrfCookie, assertCsrf, issueCsrfToken } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";
import { getAuthDeps } from "@/modules/auth/composition";
import { requestPasswordReset } from "@/modules/auth/domain/password-reset";
import {
  passwordResetRequestBodySchema,
  validationErrorFromZod,
} from "@/modules/auth/validation";
import { getNotificationsDeps } from "@/modules/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleApi(
    request,
    "POST /api/v1/auth/password-reset",
    async ({ logger }) => {
      assertCsrf(request);
      const parsed = passwordResetRequestBodySchema.safeParse(
        await parseJsonBody(request),
      );
      if (!parsed.success) {
        throw validationErrorFromZod(parsed.error);
      }

      const issued = await requestPasswordReset(
        parsed.data.email,
        getAuthDeps(),
      );
      if (issued) {
        try {
          await getNotificationsDeps().mailer.send({
            template: "password_reset",
            to: issued.email,
            payload: {
              token: issued.token,
              resetPath: issued.resetPath,
              resetUrl: `${loadEnv().APP_BASE_URL}${issued.resetPath}`,
            },
          });
        } catch {
          // Email failure must not reveal whether the address exists.
        }
        logger.info("password reset requested");
      }

      const response = NextResponse.json({ ok: true }, { status: 200 });
      applyCsrfCookie(response.headers, issueCsrfToken());
      return response;
    },
  );
}
