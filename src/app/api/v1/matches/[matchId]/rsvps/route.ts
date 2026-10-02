import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";
import { handleRsvpNotificationSideEffects } from "@/modules/notifications/domain/rsvp-side-effects";
import { getRsvpsDeps, setRsvp } from "@/modules/rsvps";
import {
  setRsvpBodySchema,
  validationErrorFromZod,
} from "@/modules/rsvps/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ matchId: string }> };

export async function POST(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(request, "POST /api/v1/matches/:id/rsvps", async ({ logger }) => {
    assertCsrf(request);
    const session = await requireSession(request);
    const { matchId } = await context.params;
    const parsed = setRsvpBodySchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const result = await setRsvp(
      {
        actorId: session.user.id,
        matchId,
        status: parsed.data.status,
      },
      getRsvpsDeps(),
    );

    await handleRsvpNotificationSideEffects({
      matchId,
      actorId: session.user.id,
      promotedUserIds: result.promotedUserIds,
      rsvpConfirmed: result.rsvpConfirmed,
    });

    logger.info("rsvp set", {
      userId: session.user.id,
      matchId,
      status: parsed.data.status,
    });
    return NextResponse.json({ rsvp: result.rsvp });
  });
}
