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
  matchId: string;
  groupId: string;
  title: string;
  sport: (typeof SPORTS)[number];
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  capacity: number;
  description: string;
};

export function EditMatchForm({
  matchId,
  groupId,
  title,
  sport,
  venue,
  date,
  startTime,
  endTime,
  timezone,
  capacity,
  description,
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
    const nextDate = String(form.get("date") ?? "");
    const nextStartTime = String(form.get("startTime") ?? "");
    const nextEndTime = String(form.get("endTime") ?? "");
    const nextTimezone = String(form.get("timezone") ?? timezone);

    let startAt: string;
    let endAt: string;
    try {
      startAt = instantFromWallClockInZone(
        nextDate,
        nextStartTime,
        nextTimezone,
      ).toISOString();
      endAt = instantFromWallClockInZone(
        nextDate,
        nextEndTime,
        nextTimezone,
      ).toISOString();
    } catch {
      setError("Could not parse date and times");
      setPending(false);
      return;
    }

    const payload = {
      title: String(form.get("title") ?? ""),
      sport: String(form.get("sport") ?? sport),
      venue: String(form.get("venue") ?? ""),
      startAt,
      endAt,
      timezone: nextTimezone,
      capacity: Number(form.get("capacity") ?? capacity),
      description: String(form.get("description") ?? ""),
    };

    try {
      const res = await fetch(`/api/v1/matches/${matchId}`, {
        method: "PATCH",
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
        setError(body.message ?? "Could not save match");
        setPending(false);
        return;
      }
      window.location.assign(`/app/matches/${matchId}`);
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(e) => void onSubmit(e)} noValidate>
      <h2>Edit match</h2>
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
          defaultValue={title}
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
          defaultValue={sport}
          aria-describedby={fieldErrors.sport ? "match-sport-error" : undefined}
          aria-invalid={fieldErrors.sport ? true : undefined}
        >
          {SPORTS.map((value) => (
            <option key={value} value={value}>
              {SPORT_LABEL[value]}
            </option>
          ))}
        </select>
        {fieldErrors.sport ? (
          <p id="match-sport-error" className="field-error" role="alert">
            {fieldErrors.sport}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="venue">Venue</label>
        <input
          id="venue"
          name="venue"
          type="text"
          required
          maxLength={200}
          defaultValue={venue}
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
          defaultValue={date}
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
            defaultValue={startTime}
            disabled={pending}
          />
        </div>
        <div className="field">
          <label htmlFor="endTime">End time</label>
          <input
            id="endTime"
            name="endTime"
            type="time"
            required
            defaultValue={endTime}
            disabled={pending}
            aria-describedby={fieldErrors.endAt ? "match-end-error" : undefined}
            aria-invalid={fieldErrors.endAt ? true : undefined}
          />
          {fieldErrors.endAt ? (
            <p id="match-end-error" className="field-error" role="alert">
              {fieldErrors.endAt}
            </p>
          ) : null}
        </div>
      </div>

      <div className="field">
        <label htmlFor="timezone">Match timezone</label>
        <input
          id="timezone"
          name="timezone"
          type="text"
          list="edit-match-timezone-options"
          defaultValue={timezone}
          required
          disabled={pending}
          aria-describedby={
            fieldErrors.timezone ? "match-timezone-error" : undefined
          }
          aria-invalid={fieldErrors.timezone ? true : undefined}
        />
        <datalist id="edit-match-timezone-options">
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
          defaultValue={capacity}
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
          defaultValue={description}
          disabled={pending}
        />
      </div>

      <p>
        <a href={`/app/groups/${groupId}`}>Cancel</a>
      </p>

      <button type="submit" className="btn" disabled={pending || !csrf}>
        {pending ? "Saving…" : "Save match"}
      </button>
    </form>
  );
}
