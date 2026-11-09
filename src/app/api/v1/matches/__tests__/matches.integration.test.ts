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
import { POST as setRsvp } from "@/app/api/v1/matches/[matchId]/rsvps/route";
import { GET as listNotifications } from "@/app/api/v1/notifications/route";
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/http/cookies";
import { setNotificationsMailerForTests } from "@/modules/notifications";
import {
  createRecordingNotificationMailer,
  type RecordedNotificationMail,
} from "@/modules/notifications/infra/smtp-mailer";
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

  it("rejects capacity below going RSVP count and allows equal capacity", async () => {
    const organizer = await registerSession("cap-org@example.com", "Organizer");
    const playerA = await registerSession("cap-a@example.com", "Player A");
    const playerB = await registerSession("cap-b@example.com", "Player B");

    const groupRes = await createGroup(
      jsonRequest("/api/v1/groups", groupBody, authHeaders(organizer)),
    );
    const { group } = (await groupRes.json()) as { group: { id: string } };

    for (const member of [playerA, playerB]) {
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
    }

    const createRes = await createMatch(
      jsonRequest(
        `/api/v1/groups/${group.id}/matches`,
        { ...matchBody, capacity: 3 },
        authHeaders(organizer),
      ),
      { params: Promise.resolve({ groupId: group.id }) },
    );
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { match: { id: string } };
    const matchId = created.match.id;

    for (const member of [playerA, playerB]) {
      const rsvpRes = await setRsvp(
        jsonRequest(
          `/api/v1/matches/${matchId}/rsvps`,
          { status: "going" },
          authHeaders(member),
        ),
        { params: Promise.resolve({ matchId }) },
      );
      expect(rsvpRes.status).toBe(200);
    }

    const tooLow = await patchMatch(
      jsonRequest(
        `/api/v1/matches/${matchId}`,
        { capacity: 1 },
        authHeaders(organizer),
        "PATCH",
      ),
      { params: Promise.resolve({ matchId }) },
    );
    expect(tooLow.status).toBe(409);
    const tooLowBody = (await tooLow.json()) as { code: string };
    expect(tooLowBody.code).toBe(DomainErrorCode.CAPACITY_BELOW_RSVPS);

    const afterReject = await getMatch(
      new Request(`${ORIGIN}/api/v1/matches/${matchId}`, {
        headers: { cookie: organizer.cookieHeader },
      }),
      { params: Promise.resolve({ matchId }) },
    );
    expect(afterReject.status).toBe(200);
    const afterRejectBody = (await afterReject.json()) as {
      match: { capacity: number };
    };
    expect(afterRejectBody.match.capacity).toBe(3);

    const equalGoing = await patchMatch(
      jsonRequest(
        `/api/v1/matches/${matchId}`,
        { capacity: 2 },
        authHeaders(organizer),
        "PATCH",
      ),
      { params: Promise.resolve({ matchId }) },
    );
    expect(equalGoing.status).toBe(200);
    const equalBody = (await equalGoing.json()) as {
      match: { capacity: number };
    };
    expect(equalBody.match.capacity).toBe(2);
  });

  it("preserves omitted description on partial edit and clears empty description", async () => {
    const organizer = await registerSession("desc-org@example.com", "Organizer");
    const groupRes = await createGroup(
      jsonRequest("/api/v1/groups", groupBody, authHeaders(organizer)),
    );
    const { group } = (await groupRes.json()) as { group: { id: string } };

    const createRes = await createMatch(
      jsonRequest(
        `/api/v1/groups/${group.id}/matches`,
        { ...matchBody, description: "Bring bibs" },
        authHeaders(organizer),
      ),
      { params: Promise.resolve({ groupId: group.id }) },
    );
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as {
      match: { id: string; description: string | null; venue: string };
    };
    expect(created.match.description).toBe("Bring bibs");
    const matchId = created.match.id;

    const venueOnly = await patchMatch(
      jsonRequest(
        `/api/v1/matches/${matchId}`,
        { venue: "Cancha Norte" },
        authHeaders(organizer),
        "PATCH",
      ),
      { params: Promise.resolve({ matchId }) },
    );
    expect(venueOnly.status).toBe(200);
    const venuePatched = (await venueOnly.json()) as {
      match: { description: string | null; venue: string };
    };
    expect(venuePatched.match.venue).toBe("Cancha Norte");
    expect(venuePatched.match.description).toBe("Bring bibs");

    const clearDesc = await patchMatch(
      jsonRequest(
        `/api/v1/matches/${matchId}`,
        { description: "" },
        authHeaders(organizer),
        "PATCH",
      ),
      { params: Promise.resolve({ matchId }) },
    );
    expect(clearDesc.status).toBe(200);
    const cleared = (await clearDesc.json()) as {
      match: { description: string | null };
    };
    expect(cleared.match.description).toBeNull();
  });

  it("notifies going and waitlisted members when start time changes, not on description-only edit", async () => {
    const sent: RecordedNotificationMail[] = [];
    setNotificationsMailerForTests(createRecordingNotificationMailer(sent));

    try {
      const organizer = await registerSession(
        "sched-org@example.com",
        "Organizer",
      );
      const going = await registerSession("sched-going@example.com", "Going");
      const waitlisted = await registerSession(
        "sched-wait@example.com",
        "Waitlisted",
      );

      const groupRes = await createGroup(
        jsonRequest("/api/v1/groups", groupBody, authHeaders(organizer)),
      );
      const { group } = (await groupRes.json()) as { group: { id: string } };

      for (const member of [going, waitlisted]) {
        const inviteRes = await createInvite(
          jsonRequest(
            `/api/v1/groups/${group.id}/invites`,
            {},
            authHeaders(organizer),
          ),
          { params: Promise.resolve({ groupId: group.id }) },
        );
        const { invite } = (await inviteRes.json()) as {
          invite: { code: string };
        };
        await acceptInvite(
          jsonRequest(
            `/api/v1/invites/${invite.code}/accept`,
            {},
            authHeaders(member),
          ),
          { params: Promise.resolve({ code: invite.code }) },
        );
      }

      const createRes = await createMatch(
        jsonRequest(
          `/api/v1/groups/${group.id}/matches`,
          { ...matchBody, capacity: 1 },
          authHeaders(organizer),
        ),
        { params: Promise.resolve({ groupId: group.id }) },
      );
      expect(createRes.status).toBe(201);
      const created = (await createRes.json()) as { match: { id: string } };
      const matchId = created.match.id;

      const goingRsvp = await setRsvp(
        jsonRequest(
          `/api/v1/matches/${matchId}/rsvps`,
          { status: "going" },
          authHeaders(going),
        ),
        { params: Promise.resolve({ matchId }) },
      );
      expect(goingRsvp.status).toBe(200);
      const waitRsvp = await setRsvp(
        jsonRequest(
          `/api/v1/matches/${matchId}/rsvps`,
          { status: "going" },
          authHeaders(waitlisted),
        ),
        { params: Promise.resolve({ matchId }) },
      );
      expect(waitRsvp.status).toBe(200);

      const mailBeforeSchedule = sent.filter(
        (message) => message.template === "match_updated",
      ).length;

      const startPatch = await patchMatch(
        jsonRequest(
          `/api/v1/matches/${matchId}`,
          { startAt: "2027-07-16T01:00:00.000Z" },
          authHeaders(organizer),
          "PATCH",
        ),
        { params: Promise.resolve({ matchId }) },
      );
      expect(startPatch.status).toBe(200);

      async function matchUpdatedCount(
        session: AuthSession,
      ): Promise<number> {
        const listRes = await listNotifications(
          new Request(`${ORIGIN}/api/v1/notifications`, {
            headers: { cookie: session.cookieHeader },
          }),
        );
        expect(listRes.status).toBe(200);
        const body = (await listRes.json()) as {
          notifications: Array<{ type: string }>;
        };
        return body.notifications.filter((n) => n.type === "match_updated")
          .length;
      }

      expect(await matchUpdatedCount(going)).toBe(1);
      expect(await matchUpdatedCount(waitlisted)).toBe(1);
      expect(await matchUpdatedCount(organizer)).toBe(0);

      const scheduleMails = sent.filter(
        (message) => message.template === "match_updated",
      );
      expect(scheduleMails).toHaveLength(mailBeforeSchedule + 2);
      expect(scheduleMails.map((message) => message.to).sort()).toEqual(
        ["sched-going@example.com", "sched-wait@example.com"].sort(),
      );

      const descPatch = await patchMatch(
        jsonRequest(
          `/api/v1/matches/${matchId}`,
          { description: "Wear dark shirts" },
          authHeaders(organizer),
          "PATCH",
        ),
        { params: Promise.resolve({ matchId }) },
      );
      expect(descPatch.status).toBe(200);
      expect(await matchUpdatedCount(going)).toBe(1);
      expect(await matchUpdatedCount(waitlisted)).toBe(1);
      expect(
        sent.filter((message) => message.template === "match_updated"),
      ).toHaveLength(mailBeforeSchedule + 2);
    } finally {
      setNotificationsMailerForTests(null);
    }
  });

  it("filters match lists and pages with nextCursor without duplicates or gaps", async () => {
    const organizer = await registerSession("list-org@example.com", "Lister");
    const groupRes = await createGroup(
      jsonRequest("/api/v1/groups", groupBody, authHeaders(organizer)),
    );
    expect(groupRes.status).toBe(201);
    const { group } = (await groupRes.json()) as { group: { id: string } };

    async function addMatch(title: string, startAt: string, endAt: string) {
      const created = await createMatch(
        jsonRequest(
          `/api/v1/groups/${group.id}/matches`,
          {
            ...matchBody,
            title,
            startAt,
            endAt,
          },
          authHeaders(organizer),
        ),
        { params: Promise.resolve({ groupId: group.id }) },
      );
      expect(created.status).toBe(201);
      const body = (await created.json()) as { match: { id: string; startAt: string } };
      return body.match;
    }

    const past = await addMatch(
      "Past kickabout",
      "2020-01-16T00:00:00.000Z",
      "2020-01-16T02:00:00.000Z",
    );
    const upcomingA = await addMatch(
      "Upcoming A",
      "2028-01-16T00:00:00.000Z",
      "2028-01-16T02:00:00.000Z",
    );
    const upcomingB = await addMatch(
      "Upcoming B",
      "2028-02-16T00:00:00.000Z",
      "2028-02-16T02:00:00.000Z",
    );
    const upcomingC = await addMatch(
      "Upcoming C",
      "2028-03-16T00:00:00.000Z",
      "2028-03-16T02:00:00.000Z",
    );
    const cancelled = await addMatch(
      "Cancelled later",
      "2028-04-16T00:00:00.000Z",
      "2028-04-16T02:00:00.000Z",
    );
    const cancelRes = await cancelMatch(
      jsonRequest(
        `/api/v1/matches/${cancelled.id}/cancel`,
        {},
        authHeaders(organizer),
      ),
      { params: Promise.resolve({ matchId: cancelled.id }) },
    );
    expect(cancelRes.status).toBe(200);

    type ListBody = {
      matches: Array<{ id: string; status: string; startAt: string }>;
      nextCursor: string | null;
    };

    async function list(query: string): Promise<ListBody> {
      const res = await listMatches(
        new Request(`${ORIGIN}/api/v1/groups/${group.id}/matches${query}`, {
          headers: { cookie: organizer.cookieHeader },
        }),
        { params: Promise.resolve({ groupId: group.id }) },
      );
      expect(res.status).toBe(200);
      return (await res.json()) as ListBody;
    }

    const upcoming = await list("?when=upcoming");
    expect(upcoming.matches.map((row) => row.id)).toEqual([
      upcomingA.id,
      upcomingB.id,
      upcomingC.id,
      cancelled.id,
    ]);
    expect(upcoming.matches.some((row) => row.id === past.id)).toBe(false);

    const pastList = await list("?when=past");
    expect(pastList.matches.map((row) => row.id)).toEqual([past.id]);

    const cancelledList = await list("?status=cancelled");
    expect(cancelledList.matches.map((row) => row.id)).toEqual([cancelled.id]);

    const ranged = await list(
      "?from=2028-02-01T00:00:00.000Z&to=2028-03-31T23:59:59.999Z",
    );
    expect(ranged.matches.map((row) => row.id)).toEqual([
      upcomingB.id,
      upcomingC.id,
    ]);

    const page1 = await list("?when=upcoming&limit=2");
    expect(page1.matches).toHaveLength(2);
    expect(page1.nextCursor).toEqual(expect.any(String));
    const page2 = await list(
      `?when=upcoming&limit=2&cursor=${encodeURIComponent(page1.nextCursor ?? "")}`,
    );
    expect(page2.matches).toHaveLength(2);
    expect(page2.nextCursor).toBeNull();

    const pagedIds = [...page1.matches, ...page2.matches].map((row) => row.id);
    expect(pagedIds).toEqual([
      upcomingA.id,
      upcomingB.id,
      upcomingC.id,
      cancelled.id,
    ]);
    expect(new Set(pagedIds).size).toBe(pagedIds.length);
  });
});
