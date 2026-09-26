import { randomBytes } from "node:crypto";

/** URL-safe invite code (~16 chars). Collision handled by unique index + retry at use-case if needed. */
export function randomInviteCode(): string {
  return randomBytes(12).toString("base64url");
}

/**
 * Invite email is out of Day 4 scope. Callers may pass an address; this no-ops.
 * Real send lands with notifications (Day 9).
 */
export function stubInviteEmail(input: {
  to: string;
  code: string;
  groupName: string;
}): void {
  void input;
}
