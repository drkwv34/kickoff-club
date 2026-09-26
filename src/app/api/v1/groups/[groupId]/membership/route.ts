import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi } from "@/lib/http/handle-api";
import { getGroupsDeps } from "@/modules/groups/composition";
import { leaveGroup } from "@/modules/groups/domain/leave-group";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

export async function DELETE(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(
    request,
    "DELETE /api/v1/groups/:id/membership",
    async ({ logger }) => {
      assertCsrf(request);
      const session = await requireSession(request);
      const { groupId } = await context.params;
      await leaveGroup(groupId, session.user.id, getGroupsDeps());
      logger.info("left group", { userId: session.user.id, groupId });
      return new NextResponse(null, { status: 204 });
    },
  );
}
