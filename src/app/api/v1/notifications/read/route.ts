import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";
import {
  getNotificationsDeps,
  markNotificationsRead,
} from "@/modules/notifications";
import {
  markNotificationsReadBodySchema,
  validationErrorFromZod,
} from "@/modules/notifications/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleApi(
    request,
    "POST /api/v1/notifications/read",
    async ({ logger }) => {
      assertCsrf(request);
      const session = await requireSession(request);
      const parsed = markNotificationsReadBodySchema.safeParse(
        await parseJsonBody(request),
      );
      if (!parsed.success) {
        throw validationErrorFromZod(parsed.error);
      }

      const result = await markNotificationsRead(
        session.user.id,
        parsed.data,
        getNotificationsDeps(),
      );
      logger.info("notifications marked read", {
        userId: session.user.id,
        marked: result.marked,
      });
      return NextResponse.json(result);
    },
  );
}
