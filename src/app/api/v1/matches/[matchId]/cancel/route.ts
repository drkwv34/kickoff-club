import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi } from "@/lib/http/handle-api";
import { getMatchesDeps } from "@/modules/matches/composition";
import { cancelMatch } from "@/modules/matches/domain/cancel-match";
import { getNotificationsDeps } from "@/modules/notifications";
import { notifyMatchCancelled } from "@/modules/notifications/domain/match-events";
import { getRsvpsDeps } from "@/modules/rsvps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ matchId: string }> };

export async function POST(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(
    request,
    "POST /api/v1/matches/:id/cancel",
    async ({ logger }) => {
      assertCsrf(request);
      const session = await requireSession(request);
      const { matchId } = await context.params;
      const matchDeps = getMatchesDeps();
      const result = await cancelMatch(matchId, session.user.id, matchDeps);
      const notifyDeps = getNotificationsDeps();
      const rsvpDeps = getRsvpsDeps();
      const recipientIds = await rsvpDeps.rsvps.listUserIdsByMatchWithStatuses(
        matchId,
        ["going", "waitlisted"],
      );
      const uniqueRecipients = [...new Set(recipientIds)];
      for (const userId of uniqueRecipients) {
        await notifyMatchCancelled(
          userId,
          matchId,
          result.match.title,
          result.match.groupId,
          notifyDeps,
        );
      }
      logger.info("match cancelled", { userId: session.user.id, matchId });
      return NextResponse.json(result);
    },
  );
}
