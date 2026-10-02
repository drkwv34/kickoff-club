import nodemailer from "nodemailer";
import { loadEnv } from "@/lib/config/env";
import type { NotificationMailer, NotificationMailTemplate } from "../domain/ports";

function subjectFor(template: NotificationMailTemplate, payload: Record<string, unknown>): string {
  const matchTitle = String(payload.matchTitle ?? payload.groupName ?? "kickoff-club");
  switch (template) {
    case "waitlist_promoted":
      return `You're in for ${matchTitle}`;
    case "rsvp_confirmed":
      return `RSVP confirmed: ${matchTitle}`;
    case "match_cancelled":
      return `Match cancelled: ${matchTitle}`;
    case "invite_received":
      return `Invite to ${String(payload.groupName ?? "a group")}`;
    case "no_show_marked":
      return `No-show recorded for ${matchTitle}`;
    default:
      return "kickoff-club notification";
  }
}

function textBody(template: NotificationMailTemplate, payload: Record<string, unknown>): string {
  const matchTitle = String(payload.matchTitle ?? "your match");
  switch (template) {
    case "waitlist_promoted":
      return `Good news — a spot opened up and you are now going to ${matchTitle}.`;
    case "rsvp_confirmed":
      return `Your RSVP is confirmed for ${matchTitle}.`;
    case "match_cancelled":
      return `The match ${matchTitle} was cancelled.`;
    case "invite_received":
      return `You joined ${String(payload.groupName ?? "a group")} on kickoff-club.`;
    case "no_show_marked":
      return `An organizer marked you as a no-show for ${matchTitle}.`;
    default:
      return JSON.stringify(payload);
  }
}

export function createSmtpNotificationMailer(): NotificationMailer {
  const env = loadEnv();
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT;

  return {
    async send({ template, to, payload }) {
      if (!host || !port) {
        return;
      }
      const transport = nodemailer.createTransport({
        host,
        port,
        secure: false,
      });
      await transport.sendMail({
        from: "noreply@kickoff-club.local",
        to,
        subject: subjectFor(template, payload),
        text: textBody(template, payload),
      });
    },
  };
}

/** Test double that records sends without SMTP. */
export function createNoopNotificationMailer(): NotificationMailer {
  return {
    async send() {
      /* no-op */
    },
  };
}
