import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { getGroupsDeps } from "@/modules/groups/composition";
import { GROUP_NOT_FOUND_MESSAGE } from "@/modules/groups/domain/messages";
import { getMatchesDeps } from "@/modules/matches/composition";
import { createMatchSeries } from "@/modules/matches/domain/create-series";
import { parseInstant } from "@/modules/matches/domain/schedule";
import {
  createSeriesBodySchema,
  validationErrorFromZod,
} from "@/modules/matches/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

export async function POST(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(
    request,
    "POST /api/v1/groups/:id/series",
    async ({ logger }) => {
      assertCsrf(request);
      const session = await requireSession(request);
      const { groupId } = await context.params;
      const parsed = createSeriesBodySchema.safeParse(
        await parseJsonBody(request),
      );
      if (!parsed.success) {
        throw validationErrorFromZod(parsed.error);
      }

      const groupsDeps = getGroupsDeps();
      const group = await groupsDeps.groups.findById(groupId);
      if (!group) {
        throw new DomainError(
          DomainErrorCode.NOT_FOUND,
          GROUP_NOT_FOUND_MESSAGE,
        );
      }

      const timezone =
        parsed.data.timezone?.trim() || group.homeTimezone;

      const result = await createMatchSeries(
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
          recurrence: parsed.data.recurrence,
        },
        getMatchesDeps(),
      );

      logger.info("match series created", {
        userId: session.user.id,
        groupId,
        seriesId: result.series.id,
        matchCount: result.matches.length,
      });
      return NextResponse.json(result, { status: 201 });
    },
  );
}
