import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi } from "@/lib/http/handle-api";
import { getGroupsDeps } from "@/modules/groups/composition";
import { acceptInvite } from "@/modules/groups/domain/accept-invite";
import { getNotificationsDeps } from "@/modules/notifications";
import { notifyInviteReceived } from "@/modules/notifications/domain/match-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

export async function POST(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(
    request,
    "POST /api/v1/invites/:code/accept",
    async ({ logger }) => {
      assertCsrf(request);
      const session = await requireSession(request);
      const { code } = await context.params;
      const result = await acceptInvite(code, session.user.id, getGroupsDeps());
      await notifyInviteReceived(
        session.user.id,
        result.group.id,
        result.group.name,
        getNotificationsDeps(),
      );
      logger.info("invite accepted", {
        userId: session.user.id,
        groupId: result.group.id,
      });
      return NextResponse.json(result);
    },
  );
}
