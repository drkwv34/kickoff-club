import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";
import { getGroupsDeps } from "@/modules/groups/composition";
import { createInvite } from "@/modules/groups/domain/create-invite";
import { stubInviteEmail } from "@/modules/groups/infra/invite-code";
import {
  createInviteBodySchema,
  validationErrorFromZod,
} from "@/modules/groups/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

export async function POST(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(
    request,
    "POST /api/v1/groups/:id/invites",
    async ({ logger }) => {
      assertCsrf(request);
      const session = await requireSession(request);
      const { groupId } = await context.params;
      const parsed = createInviteBodySchema.safeParse(
        await parseJsonBody(request),
      );
      if (!parsed.success) {
        throw validationErrorFromZod(parsed.error);
      }

      const invite = await createInvite(
        {
          groupId,
          actorId: session.user.id,
          maxUses: parsed.data.maxUses,
        },
        getGroupsDeps(),
      );

      if (parsed.data.email) {
        stubInviteEmail({
          to: parsed.data.email,
          code: invite.code,
          groupName: groupId,
        });
      }

      logger.info("invite created", {
        userId: session.user.id,
        groupId,
      });
      return NextResponse.json({ invite }, { status: 201 });
    },
  );
}
