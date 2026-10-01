import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/v1/auth/register/route";
import { GET as csrf } from "@/app/api/v1/auth/csrf/route";
import { POST as createGroup } from "@/app/api/v1/groups/route";
import { POST as createInvite } from "@/app/api/v1/groups/[groupId]/invites/route";
import { POST as acceptInvite } from "@/app/api/v1/invites/[code]/accept/route";
import { POST as createMatch } from "@/app/api/v1/groups/[groupId]/matches/route";
import { GET as getMatch } from "@/app/api/v1/matches/[matchId]/route";
import { POST as setRsvp } from "@/app/api/v1/matches/[matchId]/rsvps/route";
import { DELETE as cancelRsvp } from "@/app/api/v1/matches/[matchId]/rsvps/me/route";
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

const groupBody = {
  name: "RSVP Club",
  sportDefault: "futbol",
  homeTimezone: "America/Bogota",
};

async function setupGroupWithMembers(
  capacity: number,
  memberCount: number,
): Promise<{
  matchId: string;
  organizer: AuthSession;
  members: AuthSession[];
}> {
  const organizer = await registerSession("org-rsvp@example.com", "Organizer");
  const groupRes = await createGroup(
    jsonRequest("/api/v1/groups", groupBody, authHeaders(organizer)),
  );
  const { group } = (await groupRes.json()) as { group: { id: string } };

  const members: AuthSession[] = [];
  for (let i = 0; i < memberCount; i++) {
    const member = await registerSession(
      `player-rsvp-${i}@example.com`,
      `Player ${i}`,
    );
    const inviteRes = await createInvite(
      jsonRequest(
        `/api/v1/groups/${group.id}/invites`,
        {},
        authHeaders(organizer),
      ),
      { params: Promise.resolve({ groupId: group.id }) },
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
    members.push(member);
  }

  const matchRes = await createMatch(
    jsonRequest(
      `/api/v1/groups/${group.id}/matches`,
      {
        title: "Small-sided",
        sport: "futbol",
        venue: "Pitch A",
        startAt: "2028-07-16T00:00:00.000Z",
        endAt: "2028-07-16T02:00:00.000Z",
        timezone: "America/Bogota",
        capacity,
      },
      authHeaders(organizer),
    ),
    { params: Promise.resolve({ groupId: group.id }) },
  );
  expect(matchRes.status).toBe(201);
  const { match } = (await matchRes.json()) as { match: { id: string } };
  return { matchId: match.id, organizer, members };
}

describe("RSVP HTTP integration", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetAuthTables();
  });

  afterAll(async () => {
    await resetAuthTables();
  });

  it("fills capacity sequentially; overflow waitlisted; idempotent going", async () => {
    const { matchId, members } = await setupGroupWithMembers(2, 3);

    for (let i = 0; i < 2; i++) {
      const res = await setRsvp(
        jsonRequest(
          `/api/v1/matches/${matchId}/rsvps`,
          { status: "going" },
          authHeaders(members[i]),
        ),
        { params: Promise.resolve({ matchId }) },
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { rsvp: { status: string } };
      expect(body.rsvp.status).toBe("going");
    }

    const waitRes = await setRsvp(
      jsonRequest(
        `/api/v1/matches/${matchId}/rsvps`,
        { status: "going" },
        authHeaders(members[2]),
      ),
      { params: Promise.resolve({ matchId }) },
    );
    expect(waitRes.status).toBe(200);
    const waitBody = (await waitRes.json()) as {
      rsvp: { status: string; waitlistPosition: number };
    };
    expect(waitBody.rsvp.status).toBe("waitlisted");
    expect(waitBody.rsvp.waitlistPosition).toBe(1);

    const again = await setRsvp(
      jsonRequest(
        `/api/v1/matches/${matchId}/rsvps`,
        { status: "going" },
        authHeaders(members[0]),
      ),
      { params: Promise.resolve({ matchId }) },
    );
    expect(again.status).toBe(200);
    const againBody = (await again.json()) as { rsvp: { status: string } };
    expect(againBody.rsvp.status).toBe("going");

    const sql = await getTestSql();
    const [row] = await sql<{ count: number }[]>`
      select count(*)::int as count from rsvps where match_id = ${matchId} and status = 'going'
    `;
    expect(row?.count).toBe(2);
  });

  it("promotes earliest waitlisted when a going player cancels", async () => {
    const { matchId, members } = await setupGroupWithMembers(2, 3);

    await setRsvp(
      jsonRequest(
        `/api/v1/matches/${matchId}/rsvps`,
        { status: "going" },
        authHeaders(members[0]),
      ),
      { params: Promise.resolve({ matchId }) },
    );
    await setRsvp(
      jsonRequest(
        `/api/v1/matches/${matchId}/rsvps`,
        { status: "going" },
        authHeaders(members[1]),
      ),
      { params: Promise.resolve({ matchId }) },
    );
    await setRsvp(
      jsonRequest(
        `/api/v1/matches/${matchId}/rsvps`,
        { status: "going" },
        authHeaders(members[2]),
      ),
      { params: Promise.resolve({ matchId }) },
    );

    const cancelRes = await cancelRsvp(
      jsonRequest(
        `/api/v1/matches/${matchId}/rsvps/me`,
        undefined,
        authHeaders(members[0]),
        "DELETE",
      ),
      { params: Promise.resolve({ matchId }) },
    );
    expect(cancelRes.status).toBe(200);

    const detail = await getMatch(
      new Request(`${ORIGIN}/api/v1/matches/${matchId}`, {
        headers: { cookie: members[2].cookieHeader },
      }),
      { params: Promise.resolve({ matchId }) },
    );
    const payload = (await detail.json()) as {
      goingCount: number;
      viewerRsvp: { status: string };
    };
    expect(payload.goingCount).toBe(2);
    expect(payload.viewerRsvp.status).toBe("going");
  });

  it("parallel going cancels promote two waitlisted without exceeding capacity", async () => {
    const { matchId, members } = await setupGroupWithMembers(2, 4);

    for (let i = 0; i < 4; i++) {
      const res = await setRsvp(
        jsonRequest(
          `/api/v1/matches/${matchId}/rsvps`,
          { status: "going" },
          authHeaders(members[i]),
        ),
        { params: Promise.resolve({ matchId }) },
      );
      expect(res.status).toBe(200);
    }

    const [cancelA, cancelB] = await Promise.all([
      cancelRsvp(
        jsonRequest(
          `/api/v1/matches/${matchId}/rsvps/me`,
          undefined,
          authHeaders(members[0]),
          "DELETE",
        ),
        { params: Promise.resolve({ matchId }) },
      ),
      cancelRsvp(
        jsonRequest(
          `/api/v1/matches/${matchId}/rsvps/me`,
          undefined,
          authHeaders(members[1]),
          "DELETE",
        ),
        { params: Promise.resolve({ matchId }) },
      ),
    ]);
    expect(cancelA.status).toBe(200);
    expect(cancelB.status).toBe(200);

    const sql = await getTestSql();
    const [counts] = await sql<{ going: number; waitlisted: number }[]>`
      select
        count(*) filter (where status = 'going')::int as going,
        count(*) filter (where status = 'waitlisted')::int as waitlisted
      from rsvps
      where match_id = ${matchId}
    `;
    expect(counts?.going).toBe(2);
    expect(counts?.waitlisted).toBe(0);

    const promoted = await sql<{ user_id: string; status: string }[]>`
      select user_id, status from rsvps
      where match_id = ${matchId} and user_id in (${members[2].userId}, ${members[3].userId})
    `;
    expect(promoted.every((row) => row.status === "going")).toBe(true);
  });

  it("rejects RSVP from non-member", async () => {
    const { matchId } = await setupGroupWithMembers(4, 1);
    const outsider = await registerSession("outsider-rsvp@example.com", "Out");

    const res = await setRsvp(
      jsonRequest(
        `/api/v1/matches/${matchId}/rsvps`,
        { status: "going" },
        authHeaders(outsider),
      ),
      { params: Promise.resolve({ matchId }) },
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe(DomainErrorCode.FORBIDDEN);
  });

  it("enforces unique RSVP per user per match", async () => {
    const { matchId, members } = await setupGroupWithMembers(4, 1);
    const member = members[0];

    await setRsvp(
      jsonRequest(
        `/api/v1/matches/${matchId}/rsvps`,
        { status: "going" },
        authHeaders(member),
      ),
      { params: Promise.resolve({ matchId }) },
    );
    await setRsvp(
      jsonRequest(
        `/api/v1/matches/${matchId}/rsvps`,
        { status: "declined" },
        authHeaders(member),
      ),
      { params: Promise.resolve({ matchId }) },
    );

    const sql = await getTestSql();
    const rows = await sql<{ count: number }[]>`
      select count(*)::int as count from rsvps where match_id = ${matchId} and user_id = ${member.userId}
    `;
    expect(rows[0]?.count).toBe(1);
  });
});
