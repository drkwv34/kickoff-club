import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { handleApi } from "@/lib/http/handle-api";
import { getNotificationsDeps, listNotifications } from "@/modules/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleApi(request, "GET /api/v1/notifications", async ({ logger }) => {
    const session = await requireSession(request);
    const result = await listNotifications(session.user.id, getNotificationsDeps());
    logger.info("notifications listed", {
      userId: session.user.id,
      unreadCount: result.unreadCount,
    });
    return NextResponse.json(result);
  });
}
