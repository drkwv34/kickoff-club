import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";
import { getGroupsDeps } from "@/modules/groups/composition";
import { changeMemberRole } from "@/modules/groups/domain/change-role";
import {
  changeRoleBodySchema,
  validationErrorFromZod,
} from "@/modules/groups/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string; userId: string }> };

export async function PATCH(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(
    request,
    "PATCH /api/v1/groups/:id/members/:userId",
    async ({ logger }) => {
      assertCsrf(request);
      const session = await requireSession(request);
      const { groupId, userId } = await context.params;
      const parsed = changeRoleBodySchema.safeParse(await parseJsonBody(request));
      if (!parsed.success) {
        throw validationErrorFromZod(parsed.error);
      }

      const membership = await changeMemberRole(
        {
          groupId,
          actorId: session.user.id,
          targetUserId: userId,
          role: parsed.data.role,
        },
        getGroupsDeps(),
      );
      logger.info("member role changed", {
        userId: session.user.id,
        groupId,
        targetUserId: userId,
        role: membership.role,
      });
      return NextResponse.json({
        membership: {
          userId: membership.userId,
          groupId: membership.groupId,
          role: membership.role,
          noShowCount: membership.noShowCount,
          joinedAt: membership.joinedAt.toISOString(),
        },
      });
    },
  );
}
