"use client";

import { useState, type FormEvent } from "react";
import { COMMON_TIMEZONES } from "@/modules/auth/domain/timezone";
import { SPORTS } from "@/modules/groups/domain/types";
import { useCsrfToken } from "./use-csrf-token";

const SPORT_LABEL: Record<(typeof SPORTS)[number], string> = {
  futbol: "Futbol",
  basketball: "Basketball",
  volleyball: "Volleyball",
  tennis: "Tennis",
  other: "Other",
};

type ApiErrorBody = {
  code?: string;
  message?: string;
  fields?: Record<string, string>;
};

export function CreateGroupForm() {
  const csrf = useCsrfToken();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!csrf) return;
    setPending(true);
    setError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      sportDefault: String(form.get("sportDefault") ?? ""),
      homeTimezone: String(form.get("homeTimezone") ?? ""),
      description: String(form.get("description") ?? ""),
    };

    try {
      const res = await fetch("/api/v1/groups", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as ApiErrorBody & {
        group?: { id: string };
      };
      if (!res.ok) {
        setFieldErrors(body.fields ?? {});
        setError(body.message ?? "Could not create group");
        setPending(false);
        return;
      }
      if (body.group?.id) {
        window.location.assign(`/app/groups/${body.group.id}`);
        return;
      }
      window.location.assign("/app");
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(e) => void onSubmit(e)} noValidate>
      <h2>Create a group</h2>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="name">Group name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={80}
          disabled={pending}
        />
        {fieldErrors.name ? (
          <p className="field-error">{fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="sportDefault">Default sport</label>
        <select
          id="sportDefault"
          name="sportDefault"
          required
          disabled={pending}
          defaultValue="futbol"
        >
          {SPORTS.map((sport) => (
            <option key={sport} value={sport}>
              {SPORT_LABEL[sport]}
            </option>
          ))}
        </select>
        {fieldErrors.sportDefault ? (
          <p className="field-error">{fieldErrors.sportDefault}</p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="homeTimezone">Home timezone</label>
        <input
          id="homeTimezone"
          name="homeTimezone"
          type="text"
          list="timezone-options"
          defaultValue="America/Bogota"
          required
          disabled={pending}
        />
        <datalist id="timezone-options">
          {COMMON_TIMEZONES.map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
        {fieldErrors.homeTimezone ? (
          <p className="field-error">{fieldErrors.homeTimezone}</p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          disabled={pending}
        />
        {fieldErrors.description ? (
          <p className="field-error">{fieldErrors.description}</p>
        ) : null}
      </div>

      <button type="submit" className="btn" disabled={pending || !csrf}>
        {pending ? "Creating…" : "Create group"}
      </button>
    </form>
  );
}
