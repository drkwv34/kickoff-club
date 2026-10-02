import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi } from "@/lib/http/handle-api";
import { handleRsvpNotificationSideEffects } from "@/modules/notifications/domain/rsvp-side-effects";
import { cancelMyRsvp, getRsvpsDeps } from "@/modules/rsvps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ matchId: string }> };

export async function DELETE(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(
    request,
    "DELETE /api/v1/matches/:id/rsvps/me",
    async ({ logger }) => {
      assertCsrf(request);
      const session = await requireSession(request);
      const { matchId } = await context.params;

      const result = await cancelMyRsvp(
        session.user.id,
        matchId,
        getRsvpsDeps(),
      );

      await handleRsvpNotificationSideEffects({
        matchId,
        actorId: session.user.id,
        promotedUserIds: result.promotedUserIds,
        rsvpConfirmed: false,
      });

      logger.info("rsvp cancelled", { userId: session.user.id, matchId });
      return NextResponse.json({ rsvp: result.rsvp });
    },
  );
}
