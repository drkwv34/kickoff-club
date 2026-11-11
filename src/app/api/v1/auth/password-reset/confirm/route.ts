import { NextResponse } from "next/server";
import { applyAuthCookies } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";
import { assertNotRateLimited } from "@/lib/http/rate-limit";
import { getAuthDeps } from "@/modules/auth/composition";
import { confirmPasswordReset } from "@/modules/auth/domain/password-reset";
import {
  passwordResetConfirmBodySchema,
  validationErrorFromZod,
} from "@/modules/auth/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleApi(
    request,
    "POST /api/v1/auth/password-reset/confirm",
    async ({ logger }) => {
      assertCsrf(request);
      assertNotRateLimited(request, "password-reset-confirm");
      const parsed = passwordResetConfirmBodySchema.safeParse(
        await parseJsonBody(request),
      );
      if (!parsed.success) {
        throw validationErrorFromZod(parsed.error);
      }

      const result = await confirmPasswordReset(parsed.data, getAuthDeps());
      logger.info("password reset completed", { userId: result.user.id });

      const response = NextResponse.json({ user: result.user }, { status: 200 });
      applyAuthCookies(response.headers, result.sessionToken, result.expiresAt);
      return response;
    },
  );
}
