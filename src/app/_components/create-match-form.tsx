"use client";

import { useState, type FormEvent } from "react";
import { COMMON_TIMEZONES } from "@/modules/auth/domain/timezone";
import { SPORTS } from "@/modules/groups/domain/types";
import { instantFromWallClockInZone } from "@/modules/matches/domain/wall-clock";
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

type Props = {
  groupId: string;
  defaultTimezone: string;
  defaultSport: (typeof SPORTS)[number];
};

export function CreateMatchForm({
  groupId,
  defaultTimezone,
  defaultSport,
}: Props) {
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
    const date = String(form.get("date") ?? "");
    const startTime = String(form.get("startTime") ?? "");
    const endTime = String(form.get("endTime") ?? "");
    const timezone = String(form.get("timezone") ?? defaultTimezone);

    let startAt: string;
    let endAt: string;
    try {
      startAt = instantFromWallClockInZone(date, startTime, timezone).toISOString();
      endAt = instantFromWallClockInZone(date, endTime, timezone).toISOString();
    } catch {
      setError("Could not parse date and times");
      setPending(false);
      return;
    }

    const payload = {
      title: String(form.get("title") ?? ""),
      sport: String(form.get("sport") ?? defaultSport),
      venue: String(form.get("venue") ?? ""),
      startAt,
      endAt,
      timezone,
      capacity: Number(form.get("capacity") ?? 10),
      description: String(form.get("description") ?? ""),
    };

    try {
      const res = await fetch(`/api/v1/groups/${groupId}/matches`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as ApiErrorBody & {
        match?: { id: string };
      };
      if (!res.ok) {
        setFieldErrors(body.fields ?? {});
        setError(body.message ?? "Could not create match");
        setPending(false);
        return;
      }
      if (body.match?.id) {
        window.location.assign(`/app/matches/${body.match.id}`);
        return;
      }
      window.location.assign(`/app/groups/${groupId}`);
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(e) => void onSubmit(e)} noValidate>
      <h2>Schedule a match</h2>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          disabled={pending}
          aria-describedby={fieldErrors.title ? "match-title-error" : undefined}
          aria-invalid={fieldErrors.title ? true : undefined}
        />
        {fieldErrors.title ? (
          <p id="match-title-error" className="field-error" role="alert">
            {fieldErrors.title}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="sport">Sport</label>
        <select
          id="sport"
          name="sport"
          required
          disabled={pending}
          defaultValue={defaultSport}
        >
          {SPORTS.map((sport) => (
            <option key={sport} value={sport}>
              {SPORT_LABEL[sport]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="venue">Venue</label>
        <input
          id="venue"
          name="venue"
          type="text"
          required
          maxLength={200}
          disabled={pending}
          aria-describedby={fieldErrors.venue ? "match-venue-error" : undefined}
          aria-invalid={fieldErrors.venue ? true : undefined}
        />
        {fieldErrors.venue ? (
          <p id="match-venue-error" className="field-error" role="alert">
            {fieldErrors.venue}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="date">Date (match timezone)</label>
        <input
          id="date"
          name="date"
          type="date"
          required
          disabled={pending}
          aria-describedby={fieldErrors.startAt ? "match-date-error" : undefined}
          aria-invalid={fieldErrors.startAt ? true : undefined}
        />
        {fieldErrors.startAt ? (
          <p id="match-date-error" className="field-error" role="alert">
            {fieldErrors.startAt}
          </p>
        ) : null}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="startTime">Start time</label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            required
            disabled={pending}
          />
        </div>
        <div className="field">
          <label htmlFor="endTime">End time</label>
          <input id="endTime" name="endTime" type="time" required disabled={pending} />
          {fieldErrors.endAt ? (
            <p className="field-error">{fieldErrors.endAt}</p>
          ) : null}
        </div>
      </div>

      <div className="field">
        <label htmlFor="timezone">Match timezone</label>
        <input
          id="timezone"
          name="timezone"
          type="text"
          list="match-timezone-options"
          defaultValue={defaultTimezone}
          required
          disabled={pending}
          aria-describedby={
            fieldErrors.timezone ? "match-timezone-error" : undefined
          }
          aria-invalid={fieldErrors.timezone ? true : undefined}
        />
        <datalist id="match-timezone-options">
          {COMMON_TIMEZONES.map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
        {fieldErrors.timezone ? (
          <p id="match-timezone-error" className="field-error" role="alert">
            {fieldErrors.timezone}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="capacity">Capacity</label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          max={200}
          defaultValue={10}
          required
          disabled={pending}
          aria-describedby={
            fieldErrors.capacity ? "match-capacity-error" : undefined
          }
          aria-invalid={fieldErrors.capacity ? true : undefined}
        />
        {fieldErrors.capacity ? (
          <p id="match-capacity-error" className="field-error" role="alert">
            {fieldErrors.capacity}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          disabled={pending}
        />
      </div>

      <button type="submit" className="btn" disabled={pending || !csrf}>
        {pending ? "Creating…" : "Create match"}
      </button>
    </form>
  );
}
