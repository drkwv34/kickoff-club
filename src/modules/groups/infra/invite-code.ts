import { randomBytes } from "node:crypto";
import type { NotificationMailer } from "@/modules/notifications/domain/ports";

/** URL-safe invite code (~16 chars). Collision handled by unique index + retry at use-case if needed. */
export function randomInviteCode(): string {
  return randomBytes(12).toString("base64url");
}

export type InviteEmailInput = {
  to: string;
  code: string;
  groupName: string;
  acceptPath: string;
  acceptUrl: string;
};

/** Send an invite through the shared notification mailer (SMTP / test double). */
export async function sendInviteEmail(
  mailer: NotificationMailer,
  input: InviteEmailInput,
): Promise<void> {
  await mailer.send({
    template: "invite_received",
    to: input.to,
    payload: {
      groupName: input.groupName,
      code: input.code,
      acceptPath: input.acceptPath,
      acceptUrl: input.acceptUrl,
    },
  });
}
