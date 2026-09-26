import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/v1/auth/register/route";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as logout } from "@/app/api/v1/auth/logout/route";
import { GET as csrf } from "@/app/api/v1/auth/csrf/route";
import { GET as me } from "@/app/api/v1/me/route";
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/http/cookies";
import { ensureTestSchema, resetAuthTables } from "@/lib/db/test-helpers";
import { DomainErrorCode } from "@/lib/errors/domain-error";
import { INVALID_CREDENTIALS_MESSAGE } from "@/modules/auth/domain/messages";

const ORIGIN = "http://localhost:3000";

function cookieFromSetCookie(lines: string[], name: string): string | undefined {
  const line = lines.find((entry) => entry.startsWith(`${name}=`));
  if (!line) return undefined;
  const pair = line.split(";", 1)[0];
  const eq = pair.indexOf("=");
  return decodeURIComponent(pair.slice(eq + 1));
}

function flagsFor(lines: string[], name: string): string {
  return lines.find((entry) => entry.startsWith(`${name}=`)) ?? "";
}

async function csrfPair(): Promise<{ token: string; cookieHeader: string }> {
  const res = await csrf(new Request(`${ORIGIN}/api/v1/auth/csrf`));
  const body = (await res.json()) as { csrfToken: string };
  const cookies = res.headers.getSetCookie();
  const fromHeader = cookieFromSetCookie(cookies, CSRF_COOKIE_NAME);
  const token = body.csrfToken;
  expect(token).toBeTruthy();
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

const registerBody = {
  email: "casey@example.com",
  password: "twelvechars!!",
  displayName: "Casey",
  timezone: "America/Bogota",
};

describe("auth HTTP integration", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetAuthTables();
  });

  afterAll(async () => {
    await resetAuthTables();
  });

  it("registers, issues HttpOnly session cookie, then serves /me", async () => {
    const { token, cookieHeader } = await csrfPair();
    const res = await register(
      jsonRequest("/api/v1/auth/register", registerBody, {
        cookie: cookieHeader,
        "x-csrf-token": token,
      }),
    );
    expect(res.status).toBe(201);
    const payload = (await res.json()) as { user: { email: string } };
    expect(payload.user.email).toBe("casey@example.com");

    const setCookie = res.headers.getSetCookie();
    const sessionFlags = flagsFor(setCookie, SESSION_COOKIE_NAME);
    expect(sessionFlags).toMatch(/HttpOnly/i);
    expect(sessionFlags).toMatch(/SameSite=Lax/i);
    expect(sessionFlags).toContain("Path=/");
    expect(sessionFlags).not.toMatch(/(?:^|; )Secure(?:;|$)/);

    const sessionToken = cookieFromSetCookie(setCookie, SESSION_COOKIE_NAME);
    expect(sessionToken).toBeTruthy();

    const meRes = await me(
      new Request(`${ORIGIN}/api/v1/me`, {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken ?? "")}`,
        },
      }),
    );
    expect(meRes.status).toBe(200);
    const meBody = (await meRes.json()) as { user: { displayName: string } };
    expect(meBody.user.displayName).toBe("Casey");
  });

  it("rejects duplicate email regardless of case with EMAIL_TAKEN", async () => {
    const first = await csrfPair();
    const created = await register(
      jsonRequest("/api/v1/auth/register", registerBody, {
        cookie: first.cookieHeader,
        "x-csrf-token": first.token,
      }),
    );
    expect(created.status).toBe(201);

    const second = await csrfPair();
    const dup = await register(
      jsonRequest(
        "/api/v1/auth/register",
        { ...registerBody, email: "Casey@Example.com" },
        { cookie: second.cookieHeader, "x-csrf-token": second.token },
      ),
    );
    expect(dup.status).toBe(409);
    const body = (await dup.json()) as { code: string; message: string };
    expect(body.code).toBe(DomainErrorCode.EMAIL_TAKEN);
  });

  it("returns the same invalid-credentials message for unknown email and bad password", async () => {
    const first = await csrfPair();
    await register(
      jsonRequest("/api/v1/auth/register", registerBody, {
        cookie: first.cookieHeader,
        "x-csrf-token": first.token,
      }),
    );

    const unknownCsrf = await csrfPair();
    const unknown = await login(
      jsonRequest(
        "/api/v1/auth/login",
        { email: "missing@example.com", password: "twelvechars!!" },
        {
          cookie: unknownCsrf.cookieHeader,
          "x-csrf-token": unknownCsrf.token,
        },
      ),
    );

    const badCsrf = await csrfPair();
    const bad = await login(
      jsonRequest(
        "/api/v1/auth/login",
        { email: registerBody.email, password: "definitely-wrong" },
        { cookie: badCsrf.cookieHeader, "x-csrf-token": badCsrf.token },
      ),
    );

    expect(unknown.status).toBe(401);
    expect(bad.status).toBe(401);
    const unknownBody = (await unknown.json()) as {
      code: string;
      message: string;
    };
    const badBody = (await bad.json()) as { code: string; message: string };
    expect(unknownBody.code).toBe(DomainErrorCode.INVALID_CREDENTIALS);
    expect(badBody.code).toBe(unknownBody.code);
    expect(unknownBody.message).toBe(INVALID_CREDENTIALS_MESSAGE);
    expect(badBody.message).toBe(unknownBody.message);
  });

  it("rejects mutating requests without CSRF with 403", async () => {
    const res = await register(
      jsonRequest("/api/v1/auth/register", registerBody),
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe(DomainErrorCode.CSRF_REJECTED);
  });

  it("revokes the session on logout so /me rejects the cookie", async () => {
    const { token, cookieHeader } = await csrfPair();
    const created = await register(
      jsonRequest("/api/v1/auth/register", registerBody, {
        cookie: cookieHeader,
        "x-csrf-token": token,
      }),
    );
    const setCookie = created.headers.getSetCookie();
    const sessionToken = cookieFromSetCookie(setCookie, SESSION_COOKIE_NAME);
    const csrfAfter = cookieFromSetCookie(setCookie, CSRF_COOKIE_NAME);

    const logoutCsrf = csrfAfter ?? (await csrfPair()).token;
    const logoutCookie = [
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken ?? "")}`,
      `${CSRF_COOKIE_NAME}=${encodeURIComponent(logoutCsrf)}`,
    ].join("; ");

    const logoutRes = await logout(
      new Request(`${ORIGIN}/api/v1/auth/logout`, {
        method: "POST",
        headers: {
          origin: ORIGIN,
          cookie: logoutCookie,
          "x-csrf-token": logoutCsrf,
        },
      }),
    );
    expect(logoutRes.status).toBe(204);

    const meRes = await me(
      new Request(`${ORIGIN}/api/v1/me`, {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken ?? "")}`,
        },
      }),
    );
    expect(meRes.status).toBe(401);
    const meBody = (await meRes.json()) as { code: string };
    expect(meBody.code).toBe(DomainErrorCode.UNAUTHENTICATED);
  });
});
