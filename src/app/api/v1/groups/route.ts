import { NextResponse } from "next/server";
import { requireSession } from "@/lib/http/auth-cookies";
import { assertCsrf } from "@/lib/http/csrf";
import { handleApi, parseJsonBody } from "@/lib/http/handle-api";
import { getGroupsDeps } from "@/modules/groups/composition";
import { createGroup } from "@/modules/groups/domain/create-group";
import { listGroupsForUser } from "@/modules/groups/domain/list-groups";
import {
  createGroupBodySchema,
  validationErrorFromZod,
} from "@/modules/groups/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleApi(request, "GET /api/v1/groups", async ({ logger }) => {
    const session = await requireSession(request);
    const groups = await listGroupsForUser(session.user.id, getGroupsDeps());
    logger.info("list groups", { userId: session.user.id, count: groups.length });
    return NextResponse.json({ groups });
  });
}

export async function POST(request: Request): Promise<Response> {
  return handleApi(request, "POST /api/v1/groups", async ({ logger }) => {
    assertCsrf(request);
    const session = await requireSession(request);
    const parsed = createGroupBodySchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const result = await createGroup(
      {
        actorId: session.user.id,
        name: parsed.data.name,
        sportDefault: parsed.data.sportDefault,
        homeTimezone: parsed.data.homeTimezone,
        description: parsed.data.description,
      },
      getGroupsDeps(),
    );
    logger.info("group created", {
      userId: session.user.id,
      groupId: result.group.id,
    });
    return NextResponse.json(result, { status: 201 });
  });
}
