import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/v1/auth/register/route";
import { GET as csrf } from "@/app/api/v1/auth/csrf/route";
import { POST as createGroup } from "@/app/api/v1/groups/route";
import { POST as createInvite } from "@/app/api/v1/groups/[groupId]/invites/route";
import { POST as acceptInvite } from "@/app/api/v1/invites/[code]/accept/route";
import {
  GET as listMatches,
  POST as createMatch,
} from "@/app/api/v1/groups/[groupId]/matches/route";
import {
  GET as getMatch,
  PATCH as patchMatch,
} from "@/app/api/v1/matches/[matchId]/route";
import { POST as cancelMatch } from "@/app/api/v1/matches/[matchId]/cancel/route";
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/http/cookies";
import { ensureTestSchema, resetAuthTables } from "@/lib/db/test-helpers";
import { DomainErrorCode } from "@/lib/errors/domain-error";
import { formatWallClock } from "@/modules/matches/domain/time-display";

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
  timezone = "America/New_York",
): Promise<AuthSession> {
  const { token, cookieHeader } = await csrfPair();
  const res = await register(
    jsonRequest(
      "/api/v1/auth/register",
      {
        email,
        password: "twelvechars!!",
        displayName,
        timezone,
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
  name: "Tuesday Futbol",
  sportDefault: "futbol",
  homeTimezone: "America/Bogota",
};

const matchBody = {
  title: "Evening kickabout",
  sport: "futbol",
  venue: "Parque La Carolina",
  startAt: "2027-07-16T00:00:00.000Z",
  endAt: "2027-07-16T02:00:00.000Z",
  timezone: "America/Bogota",
  capacity: 14,
};

describe("matches HTTP integration", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetAuthTables();
  });

  afterAll(async () => {
    await resetAuthTables();
  });

  it("organizer CRUD; player read; outsider forbidden", async () => {
    const organizer = await registerSession("org@example.com", "Organizer");
    const player = await registerSession("player@example.com", "Player");
    const outsider = await registerSession("out@example.com", "Outsider");

    const groupRes = await createGroup(
      jsonRequest("/api/v1/groups", groupBody, authHeaders(organizer)),
    );
    expect(groupRes.status).toBe(201);
    const { group } = (await groupRes.json()) as { group: { id: string } };

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
        authHeaders(player),
      ),
      { params: Promise.resolve({ code: invite.code }) },
    );

    const forbiddenCreate = await createMatch(
      jsonRequest(
        `/api/v1/groups/${group.id}/matches`,
        matchBody,
        authHeaders(player),
      ),
      { params: Promise.resolve({ groupId: group.id }) },
    );
    expect(forbiddenCreate.status).toBe(403);

    const createRes = await createMatch(
      jsonRequest(
        `/api/v1/groups/${group.id}/matches`,
        matchBody,
        authHeaders(organizer),
      ),
      { params: Promise.resolve({ groupId: group.id }) },
    );
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as {
      match: { id: string; timezone: string; startAt: string };
    };
    expect(created.match.timezone).toBe("America/Bogota");
    expect(formatWallClock(created.match.startAt, "America/Bogota")).toMatch(
      /7:00\s*PM/,
    );

    const listAsPlayer = await listMatches(
      new Request(`${ORIGIN}/api/v1/groups/${group.id}/matches`, {
        headers: { cookie: player.cookieHeader },
      }),
      { params: Promise.resolve({ groupId: group.id }) },
    );
    expect(listAsPlayer.status).toBe(200);
    const listPayload = (await listAsPlayer.json()) as {
      matches: Array<{ id: string }>;
    };
    expect(listPayload.matches).toHaveLength(1);

    const outsiderList = await listMatches(
      new Request(`${ORIGIN}/api/v1/groups/${group.id}/matches`, {
        headers: { cookie: outsider.cookieHeader },
      }),
      { params: Promise.resolve({ groupId: group.id }) },
    );
    expect(outsiderList.status).toBe(403);

    const detail = await getMatch(
      new Request(`${ORIGIN}/api/v1/matches/${created.match.id}`, {
        headers: { cookie: player.cookieHeader },
      }),
      { params: Promise.resolve({ matchId: created.match.id }) },
    );
    expect(detail.status).toBe(200);

    const patchRes = await patchMatch(
      jsonRequest(
        `/api/v1/matches/${created.match.id}`,
        { title: "Updated title", capacity: 16 },
        authHeaders(organizer),
        "PATCH",
      ),
      { params: Promise.resolve({ matchId: created.match.id }) },
    );
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as { match: { title: string } };
    expect(patched.match.title).toBe("Updated title");

    const cancelRes = await cancelMatch(
      jsonRequest(
        `/api/v1/matches/${created.match.id}/cancel`,
        {},
        authHeaders(organizer),
      ),
      { params: Promise.resolve({ matchId: created.match.id }) },
    );
    expect(cancelRes.status).toBe(200);
    const cancelled = (await cancelRes.json()) as { match: { status: string } };
    expect(cancelled.match.status).toBe("cancelled");
  });

  it("rejects endAt before startAt", async () => {
    const organizer = await registerSession("org2@example.com", "Organizer");
    const groupRes = await createGroup(
      jsonRequest("/api/v1/groups", groupBody, authHeaders(organizer)),
    );
    const { group } = (await groupRes.json()) as { group: { id: string } };

    const res = await createMatch(
      jsonRequest(
        `/api/v1/groups/${group.id}/matches`,
        {
          ...matchBody,
          startAt: "2027-07-15T04:00:00.000Z",
          endAt: "2027-07-15T02:00:00.000Z",
        },
        authHeaders(organizer),
      ),
      { params: Promise.resolve({ groupId: group.id }) },
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe(DomainErrorCode.VALIDATION_ERROR);
  });
});
