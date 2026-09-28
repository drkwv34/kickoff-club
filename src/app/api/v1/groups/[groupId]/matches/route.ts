import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { getGroupsDeps } from "@/modules/groups/composition";
import { GROUP_NOT_FOUND_MESSAGE } from "@/modules/groups/domain/messages";
import { getMatchesDeps } from "@/modules/matches/composition";
import { createMatch } from "@/modules/matches/domain/create-match";
import { listMatchesForGroup } from "@/modules/matches/domain/list-matches";
import { parseInstant } from "@/modules/matches/domain/schedule";
import {
  createMatchBodySchema,
  validationErrorFromZod,
} from "@/modules/matches/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

export async function GET(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(request, "GET /api/v1/groups/:id/matches", async ({ logger }) => {
    const session = await requireSession(request);
    const { groupId } = await context.params;
    const result = await listMatchesForGroup(
      groupId,
      session.user.id,
      getMatchesDeps(),
    );
    logger.info("list matches", {
      userId: session.user.id,
      groupId,
      count: result.matches.length,
    });
    return NextResponse.json(result);
  });
}

export async function POST(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(request, "POST /api/v1/groups/:id/matches", async ({ logger }) => {
    assertCsrf(request);
    const session = await requireSession(request);
    const { groupId } = await context.params;
    const parsed = createMatchBodySchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const groupsDeps = getGroupsDeps();
    const group = await groupsDeps.groups.findById(groupId);
    if (!group) {
      throw new DomainError(DomainErrorCode.NOT_FOUND, GROUP_NOT_FOUND_MESSAGE);
    }

    const timezone =
      parsed.data.timezone?.trim() || group.homeTimezone;

    const result = await createMatch(
      {
        actorId: session.user.id,
        groupId,
        title: parsed.data.title,
        sport: parsed.data.sport,
        venue: parsed.data.venue,
        startAt: parseInstant(parsed.data.startAt, "startAt"),
        endAt: parseInstant(parsed.data.endAt, "endAt"),
        timezone,
        capacity: parsed.data.capacity,
        description: parsed.data.description,
      },
      getMatchesDeps(),
    );

    logger.info("match created", {
      userId: session.user.id,
      groupId,
      matchId: result.match.id,
    });
    return NextResponse.json(result, { status: 201 });
  });
}
