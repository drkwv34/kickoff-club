import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi } from "@/lib/http/handle-api";
import { getMatchesDeps } from "@/modules/matches/composition";
import { cancelMatch } from "@/modules/matches/domain/cancel-match";

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
      const result = await cancelMatch(matchId, session.user.id, getMatchesDeps());
      logger.info("match cancelled", { userId: session.user.id, matchId });
      return NextResponse.json(result);
    },
  );
}
