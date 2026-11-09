import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/v1/auth/register/route";
import { GET as csrf } from "@/app/api/v1/auth/csrf/route";
import { POST as createGroup } from "@/app/api/v1/groups/route";
import { GET as getGroup } from "@/app/api/v1/groups/[groupId]/route";
import { POST as createInvite } from "@/app/api/v1/groups/[groupId]/invites/route";
import { POST as acceptInvite } from "@/app/api/v1/invites/[code]/accept/route";
import { POST as createMatch } from "@/app/api/v1/groups/[groupId]/matches/route";
import { POST as setRsvp } from "@/app/api/v1/matches/[matchId]/rsvps/route";
import { POST as markNoShow } from "@/app/api/v1/matches/[matchId]/no-shows/route";
import { DELETE as unmarkNoShow } from "@/app/api/v1/matches/[matchId]/no-shows/[userId]/route";
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/http/cookies";
import { ensureTestSchema, getTestSql, resetAuthTables } from "@/lib/db/test-helpers";
import { DomainErrorCode } from "@/lib/errors/domain-error";

const ORIGIN = "http://localhost:3000";

function cookieFromSetCookie(lines: string[], name: string): string | undefined {
  const line = lines.find((entry) => entry.startsWith(`${name}=`));
  if (!line) return undefined;
  const pair = line.split(";", 1)[0];
  const eq = pair.indexOf("=");
  return decodeURIComponent(pair.slice(eq + 1));
}

async function csrfPair(): Promise<{ token: string; cookieHeader: string }> {
  const res = await csrf(new Request(`${ORIGIN}/api/v1/auth/csrf`));
  const body = (await res.json()) as { csrfToken: string };
  const cookies = res.headers.getSetCookie();
  const fromHeader = cookieFromSetCookie(cookies, CSRF_COOKIE_NAME);
  const token = body.csrfToken;
  const cookieHeader = `${CSRF_COOKIE_NAME}=${encodeURIComponent(fromHeader ?? token)}`;
  return { token, cookieHeader };
}

function jsonRequest(
  path: string,
  body: unknown,
  extraHeaders: Record<string, string> = {},
  method = "POST",
): Request {
  return new Request(`${ORIGIN}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      origin: ORIGIN,
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

type AuthSession = {
  userId: string;
  cookieHeader: string;
  csrfToken: string;
};

async function registerSession(
  email: string,
  displayName: string,
): Promise<AuthSession> {
  const { token, cookieHeader } = await csrfPair();
  const res = await register(
    jsonRequest(
      "/api/v1/auth/register",
      {
        email,
        password: "twelvechars!!",
        displayName,
        timezone: "America/Bogota",
      },
      { cookie: cookieHeader, "x-csrf-token": token },
    ),
  );
  expect(res.status).toBe(201);
  const payload = (await res.json()) as { user: { id: string } };
  const setCookie = res.headers.getSetCookie();
  const sessionToken = cookieFromSetCookie(setCookie, SESSION_COOKIE_NAME);
  const csrfToken =
    cookieFromSetCookie(setCookie, CSRF_COOKIE_NAME) ?? token;
  return {
    userId: payload.user.id,
    csrfToken,
    cookieHeader: [
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken ?? "")}`,
      `${CSRF_COOKIE_NAME}=${encodeURIComponent(csrfToken)}`,
    ].join("; "),
  };
}

function authHeaders(session: AuthSession): Record<string, string> {
  return {
    cookie: session.cookieHeader,
    "x-csrf-token": session.csrfToken,
  };
}

async function memberNoShowCount(
  session: AuthSession,
  groupId: string,
  userId: string,
): Promise<number> {
  const res = await getGroup(
    new Request(`${ORIGIN}/api/v1/groups/${groupId}`, {
      headers: { cookie: session.cookieHeader },
    }),
    { params: Promise.resolve({ groupId }) },
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as {
    members: Array<{ userId: string; noShowCount: number }>;
  };
  const member = body.members.find((row) => row.userId === userId);
  expect(member).toBeDefined();
  return member!.noShowCount;
}

describe("no-show unmark API", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetAuthTables();
  });

  afterAll(async () => {
    await resetAuthTables();
  });

  it("organizer unmark returns 204 and count 0; player gets 403", async () => {
    const organizer = await registerSession("unmark-org@example.com", "Org");
    const player = await registerSession("unmark-player@example.com", "Player");

    const groupRes = await createGroup(
      jsonRequest(
        "/api/v1/groups",
        {
          name: "Unmark Club",
          sportDefault: "futbol",
          homeTimezone: "America/Bogota",
        },
        authHeaders(organizer),
      ),
    );
    const groupBody = (await groupRes.json()) as { group: { id: string } };
    const groupId = groupBody.group.id;

    const inviteRes = await createInvite(
      jsonRequest(`/api/v1/groups/${groupId}/invites`, {}, authHeaders(organizer)),
      { params: Promise.resolve({ groupId }) },
    );
    const { invite } = (await inviteRes.json()) as { invite: { code: string } };
    await acceptInvite(
      jsonRequest(
        `/api/v1/invites/${invite.code}/accept`,
        {},
        authHeaders(player),
      ),
      { params: Promise.resolve({ code: invite.code }) },
    );

    const matchRes = await createMatch(
      jsonRequest(
        `/api/v1/groups/${groupId}/matches`,
        {
          title: "Past start",
          sport: "futbol",
          venue: "Field",
          startAt: "2028-07-16T00:00:00.000Z",
          endAt: "2028-07-16T02:00:00.000Z",
          timezone: "America/Bogota",
          capacity: 5,
        },
        authHeaders(organizer),
      ),
      { params: Promise.resolve({ groupId }) },
    );
    const matchBody = (await matchRes.json()) as { match: { id: string } };
    const matchId = matchBody.match.id;

    await setRsvp(
      jsonRequest(
        `/api/v1/matches/${matchId}/rsvps`,
        { status: "going" },
        authHeaders(player),
      ),
      { params: Promise.resolve({ matchId }) },
    );

    const sql = await getTestSql();
    await sql`
      update matches
      set start_at = now() - interval '30 minutes'
      where id = ${matchId}::uuid
    `;

    const marked = await markNoShow(
      jsonRequest(
        `/api/v1/matches/${matchId}/no-shows`,
        { userId: player.userId },
        authHeaders(organizer),
      ),
      { params: Promise.resolve({ matchId }) },
    );
    expect(marked.status).toBe(201);
    const markedBody = (await marked.json()) as { noShowCount: number };
    expect(markedBody.noShowCount).toBe(1);

    const forbidden = await unmarkNoShow(
      jsonRequest(
        `/api/v1/matches/${matchId}/no-shows/${player.userId}`,
        undefined,
        authHeaders(player),
        "DELETE",
      ),
      { params: Promise.resolve({ matchId, userId: player.userId }) },
    );
    expect(forbidden.status).toBe(403);
    const forbiddenBody = (await forbidden.json()) as { code: string };
    expect(forbiddenBody.code).toBe(DomainErrorCode.FORBIDDEN);
    expect(await memberNoShowCount(organizer, groupId, player.userId)).toBe(1);

    const unmarked = await unmarkNoShow(
      jsonRequest(
        `/api/v1/matches/${matchId}/no-shows/${player.userId}`,
        undefined,
        authHeaders(organizer),
        "DELETE",
      ),
      { params: Promise.resolve({ matchId, userId: player.userId }) },
    );
    expect(unmarked.status).toBe(204);
    expect(await memberNoShowCount(organizer, groupId, player.userId)).toBe(0);
  });
});
