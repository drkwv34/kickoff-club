"use client";

import { useState, type FormEvent } from "react";
import { COMMON_TIMEZONES } from "@/modules/auth/domain/timezone";
import { useCsrfToken } from "./use-csrf-token";

type ApiErrorBody = {
  code?: string;
  message?: string;
  fields?: Record<string, string>;
};

function fieldDescribedBy(...ids: (string | false | undefined)[]): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

export function SettingsProfileForm({
  displayName,
  timezone,
}: {
  displayName: string;
  timezone: string;
}) {
  const csrf = useCsrfToken();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!csrf) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const payload = {
      displayName: String(form.get("displayName") ?? ""),
      timezone: String(form.get("timezone") ?? ""),
    };

    try {
      const res = await fetch("/api/v1/me", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as ApiErrorBody & {
        user?: { displayName: string; timezone: string };
      };
      if (!res.ok) {
        setFieldErrors(body.fields ?? {});
        setError(body.message ?? "Could not save profile");
        setPending(false);
        return;
      }
      setSuccess("Profile saved.");
      setPending(false);
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(e) => void onSubmit(e)} noValidate>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="form-success" role="status">
          {success}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="displayName">Display name</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="nickname"
          required
          maxLength={80}
          defaultValue={displayName}
          disabled={pending}
          aria-describedby={fieldDescribedBy(
            fieldErrors.displayName && "displayName-error",
          )}
          aria-invalid={fieldErrors.displayName ? true : undefined}
        />
        {fieldErrors.displayName ? (
          <p id="displayName-error" className="field-error" role="alert">
            {fieldErrors.displayName}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="timezone">Timezone</label>
        <input
          id="timezone"
          name="timezone"
          type="text"
          list="settings-timezone-options"
          defaultValue={timezone}
          required
          disabled={pending}
          aria-describedby={fieldDescribedBy(
            fieldErrors.timezone && "timezone-error",
          )}
          aria-invalid={fieldErrors.timezone ? true : undefined}
        />
        <datalist id="settings-timezone-options">
          {COMMON_TIMEZONES.map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
        {fieldErrors.timezone ? (
          <p id="timezone-error" className="field-error" role="alert">
            {fieldErrors.timezone}
          </p>
        ) : null}
      </div>

      <button type="submit" className="btn" disabled={pending || !csrf}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
