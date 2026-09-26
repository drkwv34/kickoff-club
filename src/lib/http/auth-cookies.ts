import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { AUTH_REQUIRED_MESSAGE } from "@/modules/auth/domain/messages";
import { getAuthDeps } from "@/modules/auth/composition";
import { resolveSession } from "@/modules/auth/domain/resolve-session";
import type { PublicUser } from "@/modules/auth/domain/user";
import {
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  appendCookie,
  clearedCookieOptions,
  readCookie,
  sessionCookieOptions,
} from "./cookies";
import { applyCsrfCookie, issueCsrfToken } from "./csrf";

export type RequestSession = {
  sessionId: string;
  user: PublicUser;
  expiresAt: Date;
};

export async function loadSessionFromRequest(
  request: Request,
): Promise<RequestSession | null> {
  const token = readCookie(request, SESSION_COOKIE_NAME);
  if (!token) return null;
  const resolved = await resolveSession(token, getAuthDeps());
  if (!resolved) return null;
  return {
    sessionId: resolved.session.id,
    user: resolved.user,
    expiresAt: resolved.expiresAt,
  };
}

export async function requireSession(
  request: Request,
): Promise<RequestSession> {
  const session = await loadSessionFromRequest(request);
  if (!session) {
    throw new DomainError(DomainErrorCode.UNAUTHENTICATED, AUTH_REQUIRED_MESSAGE);
  }
  return session;
}

export function applySessionCookie(
  headers: Headers,
  sessionToken: string,
  expiresAt: Date,
): void {
  appendCookie(
    headers,
    SESSION_COOKIE_NAME,
    sessionToken,
    sessionCookieOptions(expiresAt),
  );
}

export function applyAuthCookies(
  headers: Headers,
  sessionToken: string,
  expiresAt: Date,
): void {
  applySessionCookie(headers, sessionToken, expiresAt);
  applyCsrfCookie(headers, issueCsrfToken());
}

export function clearAuthCookies(headers: Headers): void {
  appendCookie(headers, SESSION_COOKIE_NAME, "", clearedCookieOptions(true));
  appendCookie(headers, CSRF_COOKIE_NAME, "", clearedCookieOptions(false));
}
