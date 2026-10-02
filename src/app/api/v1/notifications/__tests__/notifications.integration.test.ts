import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/v1/auth/register/route";
import { GET as csrf } from "@/app/api/v1/auth/csrf/route";
import { POST as createGroup } from "@/app/api/v1/groups/route";
import { POST as createInvite } from "@/app/api/v1/groups/[groupId]/invites/route";
import { POST as acceptInvite } from "@/app/api/v1/invites/[code]/accept/route";
import { POST as createMatch } from "@/app/api/v1/groups/[groupId]/matches/route";
import { POST as setRsvp } from "@/app/api/v1/matches/[matchId]/rsvps/route";
import { DELETE as cancelRsvp } from "@/app/api/v1/matches/[matchId]/rsvps/me/route";
import { POST as markNoShow } from "@/app/api/v1/matches/[matchId]/no-shows/route";
import { GET as listNotifications } from "@/app/api/v1/notifications/route";
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/http/cookies";
import { ensureTestSchema, getTestSql, resetAuthTables } from "@/lib/db/test-helpers";

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

async function joinGroup(
  organizer: AuthSession,
  groupId: string,
  member: AuthSession,
): Promise<void> {
  const inviteRes = await createInvite(
    jsonRequest(`/api/v1/groups/${groupId}/invites`, {}, authHeaders(organizer)),
    { params: Promise.resolve({ groupId }) },
  );
  const { invite } = (await inviteRes.json()) as { invite: { code: string } };
  await acceptInvite(
    jsonRequest(
      `/api/v1/invites/${invite.code}/accept`,
      {},
      authHeaders(member),
    ),
    { params: Promise.resolve({ code: invite.code }) },
  );
}

describe("notifications and no-shows API", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetAuthTables();
  });

  afterAll(async () => {
    await resetAuthTables();
  });

  it("creates waitlist_promoted notification when a spot opens", async () => {
    const organizer = await registerSession("org@example.com", "Org");
    const playerA = await registerSession("a@example.com", "A");
    const playerB = await registerSession("b@example.com", "B");

    const groupRes = await createGroup(
      jsonRequest(
        "/api/v1/groups",
        {
          name: "Notify Club",
          sportDefault: "futbol",
          homeTimezone: "America/Bogota",
        },
        authHeaders(organizer),
      ),
    );
    const groupBody = (await groupRes.json()) as { group: { id: string } };
    const groupId = groupBody.group.id;
    await joinGroup(organizer, groupId, playerA);
    await joinGroup(organizer, groupId, playerB);

    const matchRes = await createMatch(
      jsonRequest(
        `/api/v1/groups/${groupId}/matches`,
        {
          title: "Full match",
          sport: "futbol",
          venue: "Field",
          startAt: "2028-07-16T00:00:00.000Z",
          endAt: "2028-07-16T02:00:00.000Z",
          timezone: "America/Bogota",
          capacity: 1,
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
        authHeaders(playerA),
      ),
      { params: Promise.resolve({ matchId }) },
    );
    await setRsvp(
      jsonRequest(
        `/api/v1/matches/${matchId}/rsvps`,
        { status: "going" },
        authHeaders(playerB),
      ),
      { params: Promise.resolve({ matchId }) },
    );

    await cancelRsvp(
      jsonRequest(
        `/api/v1/matches/${matchId}/rsvps/me`,
        undefined,
        authHeaders(playerA),
        "DELETE",
      ),
      { params: Promise.resolve({ matchId }) },
    );

    const listRes = await listNotifications(
      new Request(`${ORIGIN}/api/v1/notifications`, {
        headers: authHeaders(playerB),
      }),
    );
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as {
      unreadCount: number;
      notifications: Array<{ type: string }>;
    };
    expect(listBody.unreadCount).toBeGreaterThanOrEqual(1);
    expect(
      listBody.notifications.some((n) => n.type === "waitlist_promoted"),
    ).toBe(true);
  });

  it("organizer can mark no-show after start; player cannot", async () => {
    const organizer = await registerSession("org2@example.com", "Org2");
    const player = await registerSession("p2@example.com", "P2");

    const groupRes = await createGroup(
      jsonRequest(
        "/api/v1/groups",
        {
          name: "NoShow Club",
          sportDefault: "futbol",
          homeTimezone: "America/Bogota",
        },
        authHeaders(organizer),
      ),
    );
    const groupBody = (await groupRes.json()) as { group: { id: string } };
    const groupId = groupBody.group.id;
    await joinGroup(organizer, groupId, player);

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

    const forbidden = await markNoShow(
      jsonRequest(
        `/api/v1/matches/${matchId}/no-shows`,
        { userId: player.userId },
        authHeaders(player),
      ),
      { params: Promise.resolve({ matchId }) },
    );
    expect(forbidden.status).toBe(403);

    const ok = await markNoShow(
      jsonRequest(
        `/api/v1/matches/${matchId}/no-shows`,
        { userId: player.userId },
        authHeaders(organizer),
      ),
      { params: Promise.resolve({ matchId }) },
    );
    expect(ok.status).toBe(201);
    const body = (await ok.json()) as { noShowCount: number };
    expect(body.noShowCount).toBe(1);
  });
});
