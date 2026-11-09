import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi } from "@/lib/http/handle-api";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { getMatchesDeps } from "@/modules/matches/composition";
import { unmarkNoShow } from "@/modules/matches/domain/unmark-no-show";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ matchId: string; userId: string }> };

const userIdParam = z.string().uuid("userId must be a valid UUID");

export async function DELETE(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(
    request,
    "DELETE /api/v1/matches/:id/no-shows/:userId",
    async ({ logger }) => {
      assertCsrf(request);
      const session = await requireSession(request);
      const { matchId, userId } = await context.params;
      const parsed = userIdParam.safeParse(userId);
      if (!parsed.success) {
        throw new DomainError(
          DomainErrorCode.VALIDATION_ERROR,
          "userId must be a valid UUID",
          { fields: { userId: "userId must be a valid UUID" } },
        );
      }

      await unmarkNoShow(matchId, parsed.data, session.user.id, getMatchesDeps());
      logger.info("no-show unmarked", {
        organizerId: session.user.id,
        matchId,
        userId: parsed.data,
      });
      return new NextResponse(null, { status: 204 });
    },
  );
}
