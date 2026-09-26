export const SESSION_COOKIE_NAME = "kickoff_session";
export const CSRF_COOKIE_NAME = "kickoff_csrf";

export type CookieSameSite = "Lax" | "Strict" | "None";

export type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: CookieSameSite;
  path: string;
  expires?: Date;
  maxAge?: number;
};

export function isSecureCookieEnv(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  return nodeEnv === "production";
}

export function sessionCookieOptions(expiresAt: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: isSecureCookieEnv(),
    sameSite: "Lax",
    path: "/",
    expires: expiresAt,
  };
}

export function csrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false,
    secure: isSecureCookieEnv(),
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };
}

export function clearedCookieOptions(httpOnly: boolean): CookieOptions {
  return {
    httpOnly,
    secure: isSecureCookieEnv(),
    sameSite: "Lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  };
}

export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions,
): string {
  const segments = [`${name}=${encodeURIComponent(value)}`];
  segments.push(`Path=${options.path}`);
  if (options.maxAge !== undefined) {
    segments.push(`Max-Age=${Math.floor(options.maxAge)}`);
  }
  if (options.expires) {
    segments.push(`Expires=${options.expires.toUTCString()}`);
  }
  if (options.httpOnly) segments.push("HttpOnly");
  if (options.secure) segments.push("Secure");
  segments.push(`SameSite=${options.sameSite}`);
  return segments.join("; ");
}

export function parseCookieHeader(
  header: string | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

export function readCookie(
  request: Request,
  name: string,
): string | undefined {
  return parseCookieHeader(request.headers.get("cookie"))[name];
}

export function appendCookie(
  headers: Headers,
  name: string,
  value: string,
  options: CookieOptions,
): void {
  headers.append("Set-Cookie", serializeCookie(name, value, options));
}
