import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi } from "@/lib/http/handle-api";
import { getMatchesDeps } from "@/modules/matches/composition";
import { cancelMatchSeries } from "@/modules/matches/domain/cancel-series";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ seriesId: string }> };

export async function POST(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(
    request,
    "POST /api/v1/series/:id/cancel",
    async ({ logger }) => {
      assertCsrf(request);
      const session = await requireSession(request);
      const { seriesId } = await context.params;
      const result = await cancelMatchSeries(
        seriesId,
        session.user.id,
        getMatchesDeps(),
      );

      logger.info("match series cancelled", {
        userId: session.user.id,
        seriesId,
        cancelledCount: result.cancelledCount,
      });
      return NextResponse.json(result);
    },
  );
}
