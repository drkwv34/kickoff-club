import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/v1/auth/register/route";
import { GET as csrf } from "@/app/api/v1/auth/csrf/route";
import { POST as createGroup } from "@/app/api/v1/groups/route";
import { POST as createInvite } from "@/app/api/v1/groups/[groupId]/invites/route";
import { POST as acceptInvite } from "@/app/api/v1/invites/[code]/accept/route";
import { POST as createMatch } from "@/app/api/v1/groups/[groupId]/matches/route";
import { POST as setRsvp } from "@/app/api/v1/matches/[matchId]/rsvps/route";
import { DELETE as cancelRsvp } from "@/app/api/v1/matches/[matchId]/rsvps/me/route";
import { GET as listNotifications } from "@/app/api/v1/notifications/route";
import {
  GET as getPrefs,
  PATCH as patchPrefs,
} from "@/app/api/v1/me/notification-preferences/route";
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/http/cookies";
import { ensureTestSchema, resetAuthTables } from "@/lib/db/test-helpers";
import { DomainErrorCode } from "@/lib/errors/domain-error";
import { setNotificationsMailerForTests } from "@/modules/notifications";
import {
  createRecordingNotificationMailer,
  type RecordedNotificationMail,
} from "@/modules/notifications/infra/smtp-mailer";
import { NOTIFICATION_TYPES } from "@/modules/notifications/domain/types";

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

describe("notification preferences API", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetAuthTables();
    setNotificationsMailerForTests(null);
  });

  afterAll(async () => {
    await resetAuthTables();
    setNotificationsMailerForTests(null);
  });

  it("defaults both channels on and rejects missing CSRF", async () => {
    const user = await registerSession("prefs@example.com", "Prefs");

    const listRes = await getPrefs(
      new Request(`${ORIGIN}/api/v1/me/notification-preferences`, {
        headers: { cookie: user.cookieHeader },
      }),
    );
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as {
      preferences: Array<{ type: string; inApp: boolean; email: boolean }>;
    };
    expect(listBody.preferences).toHaveLength(NOTIFICATION_TYPES.length);
    for (const type of NOTIFICATION_TYPES) {
      const row = listBody.preferences.find((item) => item.type === type);
      expect(row).toMatchObject({ type, inApp: true, email: true });
    }

    const noCsrf = await patchPrefs(
      jsonRequest(
        "/api/v1/me/notification-preferences",
        {
          preferences: [{ type: "waitlist_promoted", email: false }],
        },
        { cookie: user.cookieHeader.split("; ")[0] ?? "" },
        "PATCH",
      ),
    );
    expect(noCsrf.status).toBe(403);
    const noCsrfBody = (await noCsrf.json()) as { code: string };
    expect(noCsrfBody.code).toBe(DomainErrorCode.CSRF_REJECTED);
  });

  it("creates in-app waitlist_promoted without email when email is disabled", async () => {
    const sent: RecordedNotificationMail[] = [];
    setNotificationsMailerForTests(createRecordingNotificationMailer(sent));

    const organizer = await registerSession("org-prefs@example.com", "Org");
    const playerA = await registerSession("a-prefs@example.com", "A");
    const playerB = await registerSession("b-prefs@example.com", "B");

    const groupRes = await createGroup(
      jsonRequest(
        "/api/v1/groups",
        {
          name: "Prefs Club",
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

    const patched = await patchPrefs(
      jsonRequest(
        "/api/v1/me/notification-preferences",
        {
          preferences: [{ type: "waitlist_promoted", email: false }],
        },
        authHeaders(playerB),
        "PATCH",
      ),
    );
    expect(patched.status).toBe(200);

    sent.length = 0;

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
      notifications: Array<{ type: string }>;
    };
    expect(
      listBody.notifications.some((n) => n.type === "waitlist_promoted"),
    ).toBe(true);
    expect(sent.some((mail) => mail.template === "waitlist_promoted")).toBe(
      false,
    );
  });
});
