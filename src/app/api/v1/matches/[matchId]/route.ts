import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";
import { getMatchesDeps } from "@/modules/matches/composition";
import { getMatchDetail } from "@/modules/matches/domain/get-match";
import { getMatchRsvpSummary, getRsvpsDeps } from "@/modules/rsvps";
import { updateMatch } from "@/modules/matches/domain/update-match";
import { parseInstant } from "@/modules/matches/domain/schedule";
import {
  updateMatchBodySchema,
  validationErrorFromZod,
} from "@/modules/matches/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ matchId: string }> };

export async function GET(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(request, "GET /api/v1/matches/:id", async ({ logger }) => {
    const session = await requireSession(request);
    const { matchId } = await context.params;
    const result = await getMatchDetail(matchId, session.user.id, getMatchesDeps());
    const rsvpSummary = await getMatchRsvpSummary(
      matchId,
      session.user.id,
      getRsvpsDeps(),
    );
    logger.info("get match", { userId: session.user.id, matchId });
    return NextResponse.json({ ...result, ...rsvpSummary });
  });
}

export async function PATCH(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(request, "PATCH /api/v1/matches/:id", async ({ logger }) => {
    assertCsrf(request);
    const session = await requireSession(request);
    const { matchId } = await context.params;
    const parsed = updateMatchBodySchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const result = await updateMatch(
      {
        actorId: session.user.id,
        matchId,
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.sport !== undefined ? { sport: parsed.data.sport } : {}),
        ...(parsed.data.venue !== undefined ? { venue: parsed.data.venue } : {}),
        ...(parsed.data.startAt !== undefined
          ? { startAt: parseInstant(parsed.data.startAt, "startAt") }
          : {}),
        ...(parsed.data.endAt !== undefined
          ? { endAt: parseInstant(parsed.data.endAt, "endAt") }
          : {}),
        ...(parsed.data.timezone !== undefined
          ? { timezone: parsed.data.timezone }
          : {}),
        ...(parsed.data.capacity !== undefined
          ? { capacity: parsed.data.capacity }
          : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description }
          : {}),
      },
      getMatchesDeps(),
    );

    logger.info("match updated", { userId: session.user.id, matchId });
    return NextResponse.json(result);
  });
}
