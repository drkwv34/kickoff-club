import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { randomCsrfToken, timingSafeStringEqual } from "@/modules/auth/domain/crypto";
import { CSRF_REJECTED_MESSAGE } from "@/modules/auth/domain/messages";
import { loadEnv } from "@/lib/config/env";
import {
  CSRF_COOKIE_NAME,
  appendCookie,
  csrfCookieOptions,
  readCookie,
} from "./cookies";

const CSRF_HEADER = "x-csrf-token";

export function issueCsrfToken(): string {
  return randomCsrfToken();
}

export function applyCsrfCookie(headers: Headers, token: string): void {
  appendCookie(headers, CSRF_COOKIE_NAME, token, csrfCookieOptions());
}

export function readOrCreateCsrfToken(request: Request, headers: Headers): string {
  const existing = readCookie(request, CSRF_COOKIE_NAME);
  if (existing) return existing;
  const token = issueCsrfToken();
  applyCsrfCookie(headers, token);
  return token;
}

function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const expected = new URL(loadEnv().APP_BASE_URL).origin;
    return origin === expected;
  } catch {
    return false;
  }
}

export function assertCsrf(request: Request): void {
  if (!originAllowed(request)) {
    throw new DomainError(DomainErrorCode.CSRF_REJECTED, CSRF_REJECTED_MESSAGE);
  }

  const cookieToken = readCookie(request, CSRF_COOKIE_NAME);
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) {
    throw new DomainError(DomainErrorCode.CSRF_REJECTED, CSRF_REJECTED_MESSAGE);
  }

  if (!timingSafeStringEqual(cookieToken, headerToken)) {
    throw new DomainError(DomainErrorCode.CSRF_REJECTED, CSRF_REJECTED_MESSAGE);
  }
}
