import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { handleApi } from "@/lib/http/handle-api";
import { getGroupsDeps } from "@/modules/groups/composition";
import { getGroupDetail } from "@/modules/groups/domain/get-group";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

export async function GET(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(request, "GET /api/v1/groups/:id", async ({ logger }) => {
    const session = await requireSession(request);
    const { groupId } = await context.params;
    const detail = await getGroupDetail(groupId, session.user.id, getGroupsDeps());
    logger.info("get group", { userId: session.user.id, groupId });
    return NextResponse.json(detail);
  });
}
