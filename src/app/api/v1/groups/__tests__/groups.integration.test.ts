import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/v1/auth/register/route";
import { GET as csrf } from "@/app/api/v1/auth/csrf/route";
import { GET as listGroups, POST as createGroup } from "@/app/api/v1/groups/route";
import { GET as getGroup } from "@/app/api/v1/groups/[groupId]/route";
import { POST as createInvite } from "@/app/api/v1/groups/[groupId]/invites/route";
import { PATCH as changeRole } from "@/app/api/v1/groups/[groupId]/members/[userId]/route";
import { DELETE as leaveGroup } from "@/app/api/v1/groups/[groupId]/membership/route";
import { GET as previewInvite } from "@/app/api/v1/invites/[code]/route";
import { POST as acceptInvite } from "@/app/api/v1/invites/[code]/accept/route";
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
): Request {
  return new Request(`${ORIGIN}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: ORIGIN,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
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
  name: "Tuesday Futbol",
  sportDefault: "futbol",
  homeTimezone: "America/Bogota",
  description: "Parque La Carolina",
};

describe("groups HTTP integration", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetAuthTables();
  });

  afterAll(async () => {
    await resetAuthTables();
  });

  it("two users form a group with correct roles; last organizer cannot be demoted", async () => {
    const alice = await registerSession("alice@example.com", "Alice");
    const bob = await registerSession("bob@example.com", "Bob");

    const created = await createGroup(
      jsonRequest("/api/v1/groups", groupBody, authHeaders(alice)),
    );
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      group: { id: string };
      role: string;
    };
    expect(createdBody.role).toBe("organizer");
    const groupId = createdBody.group.id;

    const inviteRes = await createInvite(
      jsonRequest(
        `/api/v1/groups/${groupId}/invites`,
        { maxUses: 50 },
        authHeaders(alice),
      ),
      { params: Promise.resolve({ groupId }) },
    );
    expect(inviteRes.status).toBe(201);
    const inviteBody = (await inviteRes.json()) as {
      invite: { code: string };
    };
    const code = inviteBody.invite.code;

    const acceptRes = await acceptInvite(
      jsonRequest(
        `/api/v1/invites/${code}/accept`,
        {},
        authHeaders(bob),
      ),
      { params: Promise.resolve({ code }) },
    );
    expect(acceptRes.status).toBe(200);
    const acceptBody = (await acceptRes.json()) as { role: string };
    expect(acceptBody.role).toBe("player");

    const detailRes = await getGroup(
      new Request(`${ORIGIN}/api/v1/groups/${groupId}`, {
        headers: { cookie: alice.cookieHeader },
      }),
      { params: Promise.resolve({ groupId }) },
    );
    expect(detailRes.status).toBe(200);
    const detail = (await detailRes.json()) as {
      members: Array<{ userId: string; role: string }>;
    };
    const byUser = Object.fromEntries(
      detail.members.map((m) => [m.userId, m.role]),
    );
    expect(byUser[alice.userId]).toBe("organizer");
    expect(byUser[bob.userId]).toBe("player");

    const lastDemote = await changeRole(
      new Request(`${ORIGIN}/api/v1/groups/${groupId}/members/${alice.userId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: ORIGIN,
          ...authHeaders(alice),
        },
        body: JSON.stringify({ role: "player" }),
      }),
      { params: Promise.resolve({ groupId, userId: alice.userId }) },
    );
    expect(lastDemote.status).toBe(409);
    const lastBody = (await lastDemote.json()) as { code: string };
    expect(lastBody.code).toBe(DomainErrorCode.LAST_ORGANIZER);

    const lastLeave = await leaveGroup(
      new Request(`${ORIGIN}/api/v1/groups/${groupId}/membership`, {
        method: "DELETE",
        headers: { origin: ORIGIN, ...authHeaders(alice) },
      }),
      { params: Promise.resolve({ groupId }) },
    );
    expect(lastLeave.status).toBe(409);
    const leaveBody = (await lastLeave.json()) as { code: string };
    expect(leaveBody.code).toBe(DomainErrorCode.LAST_ORGANIZER);
  });

  it("rejects expired invites with 410 GONE", async () => {
    const alice = await registerSession("alice@example.com", "Alice");
    const bob = await registerSession("bob@example.com", "Bob");
    const created = await createGroup(
      jsonRequest("/api/v1/groups", groupBody, authHeaders(alice)),
    );
    const { group } = (await created.json()) as { group: { id: string } };
    const inviteRes = await createInvite(
      jsonRequest(
        `/api/v1/groups/${group.id}/invites`,
        {},
        authHeaders(alice),
      ),
      { params: Promise.resolve({ groupId: group.id }) },
    );
    const { invite } = (await inviteRes.json()) as { invite: { code: string } };

    const sql = await getTestSql();
    await sql`update group_invites set expires_at = now() - interval '1 hour' where code = ${invite.code}`;

    const preview = await previewInvite(
      new Request(`${ORIGIN}/api/v1/invites/${invite.code}`),
      { params: Promise.resolve({ code: invite.code }) },
    );
    expect(preview.status).toBe(410);
    const previewBody = (await preview.json()) as { code: string };
    expect(previewBody.code).toBe(DomainErrorCode.GONE);

    const accept = await acceptInvite(
      jsonRequest(
        `/api/v1/invites/${invite.code}/accept`,
        {},
        authHeaders(bob),
      ),
      { params: Promise.resolve({ code: invite.code }) },
    );
    expect(accept.status).toBe(410);
    const acceptBody = (await accept.json()) as { code: string };
    expect(acceptBody.code).toBe(DomainErrorCode.GONE);
  });

  it("enforces max uses: second use of a single-use code fails", async () => {
    const alice = await registerSession("alice@example.com", "Alice");
    const bob = await registerSession("bob@example.com", "Bob");
    const cara = await registerSession("cara@example.com", "Cara");
    const created = await createGroup(
      jsonRequest("/api/v1/groups", groupBody, authHeaders(alice)),
    );
    const { group } = (await created.json()) as { group: { id: string } };
    const inviteRes = await createInvite(
      jsonRequest(
        `/api/v1/groups/${group.id}/invites`,
        { maxUses: 1 },
        authHeaders(alice),
      ),
      { params: Promise.resolve({ groupId: group.id }) },
    );
    const { invite } = (await inviteRes.json()) as { invite: { code: string } };

    const first = await acceptInvite(
      jsonRequest(
        `/api/v1/invites/${invite.code}/accept`,
        {},
        authHeaders(bob),
      ),
      { params: Promise.resolve({ code: invite.code }) },
    );
    expect(first.status).toBe(200);

    const second = await acceptInvite(
      jsonRequest(
        `/api/v1/invites/${invite.code}/accept`,
        {},
        authHeaders(cara),
      ),
      { params: Promise.resolve({ code: invite.code }) },
    );
    expect(second.status).toBe(410);
    const body = (await second.json()) as { code: string };
    expect(body.code).toBe(DomainErrorCode.GONE);
  });

  it("unknown invite code returns 404", async () => {
    const res = await previewInvite(
      new Request(`${ORIGIN}/api/v1/invites/not-a-real-code`),
      { params: Promise.resolve({ code: "not-a-real-code" }) },
    );
    expect(res.status).toBe(404);
  });

  it("non-members cannot view a group or create invites", async () => {
    const alice = await registerSession("alice@example.com", "Alice");
    const bob = await registerSession("bob@example.com", "Bob");
    const created = await createGroup(
      jsonRequest("/api/v1/groups", groupBody, authHeaders(alice)),
    );
    const { group } = (await created.json()) as { group: { id: string } };

    const view = await getGroup(
      new Request(`${ORIGIN}/api/v1/groups/${group.id}`, {
        headers: { cookie: bob.cookieHeader },
      }),
      { params: Promise.resolve({ groupId: group.id }) },
    );
    expect(view.status).toBe(403);

    const invite = await createInvite(
      jsonRequest(
        `/api/v1/groups/${group.id}/invites`,
        {},
        authHeaders(bob),
      ),
      { params: Promise.resolve({ groupId: group.id }) },
    );
    expect(invite.status).toBe(403);
  });

  it("rejects create-group without CSRF", async () => {
    const alice = await registerSession("alice@example.com", "Alice");
    const res = await createGroup(
      jsonRequest("/api/v1/groups", groupBody, {
        cookie: alice.cookieHeader.split("; ")[0] ?? "",
      }),
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe(DomainErrorCode.CSRF_REJECTED);
  });

  it("lists memberships for the current user", async () => {
    const alice = await registerSession("alice@example.com", "Alice");
    await createGroup(
      jsonRequest("/api/v1/groups", groupBody, authHeaders(alice)),
    );
    const listed = await listGroups(
      new Request(`${ORIGIN}/api/v1/groups`, {
        headers: { cookie: alice.cookieHeader },
      }),
    );
    expect(listed.status).toBe(200);
    const body = (await listed.json()) as {
      groups: Array<{ role: string; group: { name: string } }>;
    };
    expect(body.groups).toHaveLength(1);
    expect(body.groups[0]?.role).toBe("organizer");
    expect(body.groups[0]?.group.name).toBe("Tuesday Futbol");
  });
});
