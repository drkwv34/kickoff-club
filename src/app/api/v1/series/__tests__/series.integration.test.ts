import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/v1/auth/register/route";
import { GET as csrf } from "@/app/api/v1/auth/csrf/route";
import { POST as createGroup } from "@/app/api/v1/groups/route";
import { POST as createSeries } from "@/app/api/v1/groups/[groupId]/series/route";
import { POST as cancelSeries } from "@/app/api/v1/series/[seriesId]/cancel/route";
import { POST as cancelMatch } from "@/app/api/v1/matches/[matchId]/cancel/route";
import { GET as listMatches } from "@/app/api/v1/groups/[groupId]/matches/route";
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/http/cookies";
import { ensureTestSchema, resetAuthTables } from "@/lib/db/test-helpers";

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

async function registerSession(email: string): Promise<AuthSession> {
  const { token, cookieHeader } = await csrfPair();
  const res = await register(
    jsonRequest(
      "/api/v1/auth/register",
      {
        email,
        password: "twelvechars!!",
        displayName: "Organizer",
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

const seriesBody = {
  title: "Weekly kickabout",
  sport: "futbol",
  venue: "Parque",
  startAt: "2027-01-07T00:00:00.000Z",
  endAt: "2027-01-07T02:00:00.000Z",
  timezone: "America/Bogota",
  capacity: 12,
  recurrence: {
    freq: "weekly" as const,
    interval: 1,
    byWeekday: ["WE"],
    count: 3,
  },
};

describe("match series API", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetAuthTables();
  });

  afterAll(async () => {
    const { getTestSql } = await import("@/lib/db/test-helpers");
    const sql = await getTestSql();
    await sql.end();
  });

  it("creates a series with N materialized matches", async () => {
    const session = await registerSession("series-org@example.com");
    const groupRes = await createGroup(
      jsonRequest(
        "/api/v1/groups",
        {
          name: "Series Club",
          sportDefault: "futbol",
          homeTimezone: "America/Bogota",
        },
        authHeaders(session),
      ),
    );
    const group = (await groupRes.json()) as { group: { id: string } };

    const res = await createSeries(
      jsonRequest(
        `/api/v1/groups/${group.group.id}/series`,
        seriesBody,
        authHeaders(session),
      ),
      { params: Promise.resolve({ groupId: group.group.id }) },
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      series: { id: string };
      matches: { id: string; seriesId: string }[];
    };
    expect(body.matches).toHaveLength(3);
    expect(body.matches.every((m) => m.seriesId === body.series.id)).toBe(true);

    const listRes = await listMatches(
      new Request(`${ORIGIN}/api/v1/groups/${group.group.id}/matches`, {
        headers: authHeaders(session),
      }),
      { params: Promise.resolve({ groupId: group.group.id }) },
    );
    const listed = (await listRes.json()) as { matches: unknown[] };
    expect(listed.matches).toHaveLength(3);
  });

  it("cancels entire series or single instance", async () => {
    const session = await registerSession("series-cancel@example.com");
    const groupRes = await createGroup(
      jsonRequest(
        "/api/v1/groups",
        {
          name: "Cancel Series",
          sportDefault: "futbol",
          homeTimezone: "America/Bogota",
        },
        authHeaders(session),
      ),
    );
    const group = (await groupRes.json()) as { group: { id: string } };

    const createRes = await createSeries(
      jsonRequest(
        `/api/v1/groups/${group.group.id}/series`,
        seriesBody,
        authHeaders(session),
      ),
      { params: Promise.resolve({ groupId: group.group.id }) },
    );
    const created = (await createRes.json()) as {
      series: { id: string };
      matches: { id: string; status: string }[];
    };

    const singleCancel = await cancelMatch(
      jsonRequest(
        `/api/v1/matches/${created.matches[0].id}/cancel`,
        {},
        authHeaders(session),
      ),
      { params: Promise.resolve({ matchId: created.matches[0].id }) },
    );
    expect(singleCancel.status).toBe(200);

    const seriesCancel = await cancelSeries(
      jsonRequest(
        `/api/v1/series/${created.series.id}/cancel`,
        {},
        authHeaders(session),
      ),
      { params: Promise.resolve({ seriesId: created.series.id }) },
    );
    expect(seriesCancel.status).toBe(200);
    const cancelled = (await seriesCancel.json()) as {
      cancelledCount: number;
      matches: { status: string }[];
    };
    expect(cancelled.cancelledCount).toBe(2);
    expect(cancelled.matches.every((m) => m.status === "cancelled")).toBe(true);
  });
});
