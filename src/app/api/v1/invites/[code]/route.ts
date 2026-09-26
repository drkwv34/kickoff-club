import { NextResponse } from "next/server";
import { handleApi } from "@/lib/http/handle-api";
import { getGroupsDeps } from "@/modules/groups/composition";
import { previewInvite } from "@/modules/groups/domain/accept-invite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(
  request: Request,
  context: Ctx,
): Promise<Response> {
  return handleApi(request, "GET /api/v1/invites/:code", async () => {
    const { code } = await context.params;
    const preview = await previewInvite(code, getGroupsDeps());
    return NextResponse.json(preview);
  });
}
