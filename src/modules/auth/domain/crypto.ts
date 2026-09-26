import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function randomSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function randomCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Constant-time string compare; length mismatch is not equal. */
export function timingSafeStringEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
