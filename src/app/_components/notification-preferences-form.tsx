"use client";

import { useState } from "react";
import type {
  NotificationType,
  PublicNotificationPreference,
} from "@/modules/notifications";
import { useCsrfToken } from "./use-csrf-token";

const TYPE_LABELS: Record<NotificationType, string> = {
  invite_received: "Invite received",
  rsvp_confirmed: "RSVP confirmed",
  waitlist_promoted: "Waitlist promoted",
  match_cancelled: "Match cancelled",
  no_show_marked: "No-show marked",
  match_updated: "Match updated",
};

type Props = {
  initialPreferences: PublicNotificationPreference[];
};

export function NotificationPreferencesForm({ initialPreferences }: Props) {
  const csrf = useCsrfToken();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function updateChannel(
    type: NotificationType,
    channel: "inApp" | "email",
    value: boolean,
  ) {
    if (!csrf || pendingType) return;
    setPendingType(type);
    setError(null);
    setMessage(null);
    const previous = preferences;
    setPreferences((current) =>
      current.map((row) =>
        row.type === type ? { ...row, [channel]: value } : row,
      ),
    );
    try {
      const res = await fetch("/api/v1/me/notification-preferences", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({
          preferences: [{ type, [channel]: value }],
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        preferences?: PublicNotificationPreference[];
      };
      if (!res.ok) {
        setPreferences(previous);
        setError(body.message ?? "Could not save notification preferences");
        return;
      }
      if (body.preferences) {
        setPreferences(body.preferences);
      }
      setMessage("Preferences saved");
    } catch {
      setPreferences(previous);
      setError("Network error. Try again.");
    } finally {
      setPendingType(null);
    }
  }

  return (
    <section
      className="notification-preferences"
      aria-labelledby="notification-preferences-heading"
    >
      <h2 id="notification-preferences-heading">Notification preferences</h2>
      <p className="lede">Choose which alerts you receive in-app and by email.</p>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="form-success">{message}</p> : null}
      <ul className="preference-list">
        {preferences.map((row) => {
          const inAppId = `pref-${row.type}-in-app`;
          const emailId = `pref-${row.type}-email`;
          return (
            <li key={row.type}>
              <fieldset disabled={pendingType === row.type || !csrf}>
                <legend>{TYPE_LABELS[row.type]}</legend>
                <div className="preference-toggles">
                  <label htmlFor={inAppId}>
                    <input
                      id={inAppId}
                      type="checkbox"
                      checked={row.inApp}
                      onChange={(event) =>
                        void updateChannel(row.type, "inApp", event.target.checked)
                      }
                    />{" "}
                    In-app
                  </label>
                  <label htmlFor={emailId}>
                    <input
                      id={emailId}
                      type="checkbox"
                      checked={row.email}
                      onChange={(event) =>
                        void updateChannel(row.type, "email", event.target.checked)
                      }
                    />{" "}
                    Email
                  </label>
                </div>
              </fieldset>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
