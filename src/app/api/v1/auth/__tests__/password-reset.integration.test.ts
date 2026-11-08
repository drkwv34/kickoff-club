import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/v1/auth/register/route";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { GET as csrf } from "@/app/api/v1/auth/csrf/route";
import { GET as me } from "@/app/api/v1/me/route";
import { POST as requestPasswordReset } from "@/app/api/v1/auth/password-reset/route";
import { POST as confirmPasswordReset } from "@/app/api/v1/auth/password-reset/confirm/route";
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/http/cookies";
import {
  ensureTestSchema,
  getTestSql,
  resetAuthTables,
} from "@/lib/db/test-helpers";
import { setNotificationsMailerForTests } from "@/modules/notifications";
import {
  createRecordingNotificationMailer,
  type RecordedNotificationMail,
} from "@/modules/notifications/infra/smtp-mailer";

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

function tokenFromMail(sent: RecordedNotificationMail[]): string {
  const mail = sent[0];
  expect(mail).toBeDefined();
  const payload = mail?.payload ?? {};
  const raw = payload.token;
  if (typeof raw === "string" && raw.length > 0) return raw;
  const url = String(payload.resetUrl ?? "");
  const fromUrl = new URL(url).searchParams.get("token");
  expect(fromUrl).toBeTruthy();
  return fromUrl ?? "";
}

describe("password reset HTTP integration", () => {
  beforeAll(async () => {
    await ensureTestSchema();
  });

  beforeEach(async () => {
    await resetAuthTables();
  });

  afterEach(() => {
    setNotificationsMailerForTests(null);
  });

  afterAll(async () => {
    await resetAuthTables();
  });

  it("emails a token for a known user, hides unknown emails, signs in on confirm, and rejects reused or expired tokens", async () => {
    const sent: RecordedNotificationMail[] = [];
    setNotificationsMailerForTests(createRecordingNotificationMailer(sent));

    const registerCsrf = await csrfPair();
    const created = await register(
      jsonRequest(
        "/api/v1/auth/register",
        {
          email: "casey@example.com",
          password: "twelvechars!!",
          displayName: "Casey",
          timezone: "America/Bogota",
        },
        {
          cookie: registerCsrf.cookieHeader,
          "x-csrf-token": registerCsrf.token,
        },
      ),
    );
    expect(created.status).toBe(201);
    const oldSession = cookieFromSetCookie(
      created.headers.getSetCookie(),
      SESSION_COOKIE_NAME,
    );

    const knownCsrf = await csrfPair();
    const known = await requestPasswordReset(
      jsonRequest(
        "/api/v1/auth/password-reset",
        { email: "casey@example.com" },
        { cookie: knownCsrf.cookieHeader, "x-csrf-token": knownCsrf.token },
      ),
    );
    expect(known.status).toBe(200);
    const knownBody = (await known.json()) as Record<string, unknown>;
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe("casey@example.com");
    const resetToken = tokenFromMail(sent);

    const unknownCsrf = await csrfPair();
    const unknown = await requestPasswordReset(
      jsonRequest(
        "/api/v1/auth/password-reset",
        { email: "missing@example.com" },
        {
          cookie: unknownCsrf.cookieHeader,
          "x-csrf-token": unknownCsrf.token,
        },
      ),
    );
    expect(unknown.status).toBe(200);
    const unknownBody = (await unknown.json()) as Record<string, unknown>;
    expect(unknownBody).toEqual(knownBody);
    expect(sent).toHaveLength(1);

    const confirmCsrf = await csrfPair();
    const confirmed = await confirmPasswordReset(
      jsonRequest(
        "/api/v1/auth/password-reset/confirm",
        { token: resetToken, password: "newpassword12" },
        {
          cookie: confirmCsrf.cookieHeader,
          "x-csrf-token": confirmCsrf.token,
        },
      ),
    );
    expect(confirmed.status).toBe(200);
    const confirmCookies = confirmed.headers.getSetCookie();
    const newSession = cookieFromSetCookie(confirmCookies, SESSION_COOKIE_NAME);
    expect(newSession).toBeTruthy();

    const meNew = await me(
      new Request(`${ORIGIN}/api/v1/me`, {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(newSession ?? "")}`,
        },
      }),
    );
    expect(meNew.status).toBe(200);

    const meOld = await me(
      new Request(`${ORIGIN}/api/v1/me`, {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(oldSession ?? "")}`,
        },
      }),
    );
    expect(meOld.status).toBe(401);

    const loginCsrf = await csrfPair();
    const loginNew = await login(
      jsonRequest(
        "/api/v1/auth/login",
        { email: "casey@example.com", password: "newpassword12" },
        { cookie: loginCsrf.cookieHeader, "x-csrf-token": loginCsrf.token },
      ),
    );
    expect(loginNew.status).toBe(200);

    const reuseCsrf = await csrfPair();
    const reused = await confirmPasswordReset(
      jsonRequest(
        "/api/v1/auth/password-reset/confirm",
        { token: resetToken, password: "anotherpass12" },
        { cookie: reuseCsrf.cookieHeader, "x-csrf-token": reuseCsrf.token },
      ),
    );
    expect([400, 410]).toContain(reused.status);

    const expireCsrf = await csrfPair();
    sent.length = 0;
    const expireRequest = await requestPasswordReset(
      jsonRequest(
        "/api/v1/auth/password-reset",
        { email: "casey@example.com" },
        { cookie: expireCsrf.cookieHeader, "x-csrf-token": expireCsrf.token },
      ),
    );
    expect(expireRequest.status).toBe(200);
    const expiredToken = tokenFromMail(sent);
    const sql = await getTestSql();
    await sql`update password_reset_tokens set expires_at = now() - interval '1 hour'`;

    const expiredCsrf = await csrfPair();
    const expired = await confirmPasswordReset(
      jsonRequest(
        "/api/v1/auth/password-reset/confirm",
        { token: expiredToken, password: "expiredpass12" },
        {
          cookie: expiredCsrf.cookieHeader,
          "x-csrf-token": expiredCsrf.token,
        },
      ),
    );
    expect([400, 410]).toContain(expired.status);
  });
});
