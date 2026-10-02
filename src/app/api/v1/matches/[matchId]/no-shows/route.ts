import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";
import { getMatchesDeps } from "@/modules/matches/composition";
import { markNoShow } from "@/modules/matches/domain/mark-no-show";
import {
  markNoShowBodySchema,
  validationErrorFromZod,
} from "@/modules/matches/validation";
import { getNotificationsDeps } from "@/modules/notifications";
import { notifyNoShowMarked } from "@/modules/notifications/domain/match-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ matchId: string }> };

export async function POST(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(
    request,
    "POST /api/v1/matches/:id/no-shows",
    async ({ logger }) => {
      assertCsrf(request);
      const session = await requireSession(request);
      const { matchId } = await context.params;
      const parsed = markNoShowBodySchema.safeParse(await parseJsonBody(request));
      if (!parsed.success) {
        throw validationErrorFromZod(parsed.error);
      }

      const matchDeps = getMatchesDeps();
      const result = await markNoShow(
        matchId,
        parsed.data.userId,
        session.user.id,
        matchDeps,
      );

      const match = await matchDeps.matches.findById(matchId);
      if (match) {
        await notifyNoShowMarked(
          parsed.data.userId,
          matchId,
          match.title,
          getNotificationsDeps(),
        );
      }

      logger.info("no-show marked", {
        organizerId: session.user.id,
        matchId,
        userId: parsed.data.userId,
      });
      return NextResponse.json(result, { status: 201 });
    },
  );
}
