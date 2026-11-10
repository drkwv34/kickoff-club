"use client";

import { useState, type FormEvent } from "react";
import { COMMON_TIMEZONES } from "@/modules/auth/domain/timezone";
import { SPORTS } from "@/modules/groups/domain/types";
import { WEEKDAYS, type Weekday } from "@/modules/matches/domain/recurrence";
import { instantFromWallClockInZone } from "@/modules/matches/domain/wall-clock";
import { useCsrfToken } from "./use-csrf-token";

const SPORT_LABEL: Record<(typeof SPORTS)[number], string> = {
  futbol: "Futbol",
  basketball: "Basketball",
  volleyball: "Volleyball",
  tennis: "Tennis",
  other: "Other",
};

const WEEKDAY_LABEL: Record<Weekday, string> = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
  SU: "Sunday",
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

function describedBy(...ids: (string | false | undefined)[]): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

export function CreateSeriesForm({
  groupId,
  defaultTimezone,
  defaultSport,
}: Props) {
  const csrf = useCsrfToken();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [endMode, setEndMode] = useState<"count" | "until">("count");

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
    const weekdays = WEEKDAYS.filter((day) => form.get(`wd-${day}`) === "on");

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

    const recurrence =
      endMode === "count"
        ? {
            freq: "weekly" as const,
            interval: Number(form.get("interval") ?? 1),
            byWeekday: weekdays,
            count: Number(form.get("count") ?? 4),
          }
        : {
            freq: "weekly" as const,
            interval: Number(form.get("interval") ?? 1),
            byWeekday: weekdays,
            until: String(form.get("until") ?? ""),
          };

    const payload = {
      title: String(form.get("title") ?? ""),
      sport: String(form.get("sport") ?? defaultSport),
      venue: String(form.get("venue") ?? ""),
      startAt,
      endAt,
      timezone,
      capacity: Number(form.get("capacity") ?? 10),
      description: String(form.get("description") ?? ""),
      recurrence,
    };

    try {
      const res = await fetch(`/api/v1/groups/${groupId}/series`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as ApiErrorBody & {
        matches?: { id: string }[];
      };
      if (!res.ok) {
        setFieldErrors(body.fields ?? {});
        setError(body.message ?? "Could not create series");
        setPending(false);
        return;
      }
      const first = body.matches?.[0]?.id;
      if (first) {
        window.location.assign(`/app/matches/${first}`);
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
      <h2>Schedule a weekly series</h2>
      <p className="lede">
        Creates up to 52 match instances up front. Cancel one match or the whole
        series from match detail (series cancel API).
      </p>
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
          aria-describedby={describedBy(fieldErrors.title && "series-title-error")}
          aria-invalid={fieldErrors.title ? true : undefined}
        />
        {fieldErrors.title ? (
          <p id="series-title-error" className="field-error" role="alert">
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
          aria-describedby={describedBy(fieldErrors.sport && "series-sport-error")}
          aria-invalid={fieldErrors.sport ? true : undefined}
        >
          {SPORTS.map((sport) => (
            <option key={sport} value={sport}>
              {SPORT_LABEL[sport]}
            </option>
          ))}
        </select>
        {fieldErrors.sport ? (
          <p id="series-sport-error" className="field-error" role="alert">
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
          disabled={pending}
          aria-describedby={describedBy(fieldErrors.venue && "series-venue-error")}
          aria-invalid={fieldErrors.venue ? true : undefined}
        />
        {fieldErrors.venue ? (
          <p id="series-venue-error" className="field-error" role="alert">
            {fieldErrors.venue}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="date">First date (match timezone)</label>
        <input
          id="date"
          name="date"
          type="date"
          required
          disabled={pending}
          aria-describedby={describedBy(fieldErrors.startAt && "series-date-error")}
          aria-invalid={fieldErrors.startAt ? true : undefined}
        />
        {fieldErrors.startAt ? (
          <p id="series-date-error" className="field-error" role="alert">
            {fieldErrors.startAt}
          </p>
        ) : null}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="startTime">Start time</label>
          <input id="startTime" name="startTime" type="time" required disabled={pending} />
        </div>
        <div className="field">
          <label htmlFor="endTime">End time</label>
          <input
            id="endTime"
            name="endTime"
            type="time"
            required
            disabled={pending}
            aria-describedby={describedBy(fieldErrors.endAt && "series-end-error")}
            aria-invalid={fieldErrors.endAt ? true : undefined}
          />
          {fieldErrors.endAt ? (
            <p id="series-end-error" className="field-error" role="alert">
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
          list="series-timezone-options"
          defaultValue={defaultTimezone}
          required
          disabled={pending}
          aria-describedby={describedBy(
            fieldErrors.timezone && "series-timezone-error",
          )}
          aria-invalid={fieldErrors.timezone ? true : undefined}
        />
        <datalist id="series-timezone-options">
          {COMMON_TIMEZONES.map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
        {fieldErrors.timezone ? (
          <p id="series-timezone-error" className="field-error" role="alert">
            {fieldErrors.timezone}
          </p>
        ) : null}
      </div>

      <fieldset
        className="field"
        aria-describedby={describedBy(
          fieldErrors["recurrence.byWeekday"] && "series-weekdays-error",
        )}
      >
        <legend>Repeat on</legend>
        {WEEKDAYS.map((day) => (
          <label key={day} className="checkbox-inline">
            <input type="checkbox" name={`wd-${day}`} disabled={pending} />
            {WEEKDAY_LABEL[day]}
          </label>
        ))}
        {fieldErrors["recurrence.byWeekday"] ? (
          <p id="series-weekdays-error" className="field-error" role="alert">
            {fieldErrors["recurrence.byWeekday"]}
          </p>
        ) : null}
      </fieldset>

      <div className="field">
        <label htmlFor="interval">Every N weeks</label>
        <input
          id="interval"
          name="interval"
          type="number"
          min={1}
          max={4}
          defaultValue={1}
          required
          disabled={pending}
          aria-describedby={describedBy(
            fieldErrors["recurrence.interval"] && "series-interval-error",
          )}
          aria-invalid={fieldErrors["recurrence.interval"] ? true : undefined}
        />
        {fieldErrors["recurrence.interval"] ? (
          <p id="series-interval-error" className="field-error" role="alert">
            {fieldErrors["recurrence.interval"]}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="endMode">Series ends</label>
        <select
          id="endMode"
          name="endMode"
          value={endMode}
          onChange={(e) => setEndMode(e.target.value as "count" | "until")}
          disabled={pending}
        >
          <option value="count">After N matches</option>
          <option value="until">On date</option>
        </select>
      </div>

      {endMode === "count" ? (
        <div className="field">
          <label htmlFor="count">Number of matches (max 52)</label>
          <input
            id="count"
            name="count"
            type="number"
            min={1}
            max={52}
            defaultValue={4}
            required
            disabled={pending}
            aria-describedby={describedBy(
              fieldErrors["recurrence.count"] && "series-count-error",
            )}
            aria-invalid={fieldErrors["recurrence.count"] ? true : undefined}
          />
          {fieldErrors["recurrence.count"] ? (
            <p id="series-count-error" className="field-error" role="alert">
              {fieldErrors["recurrence.count"]}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="field">
          <label htmlFor="until">Until date (YYYY-MM-DD)</label>
          <input
            id="until"
            name="until"
            type="date"
            required
            disabled={pending}
            aria-describedby={describedBy(
              fieldErrors["recurrence.until"] && "series-until-error",
            )}
            aria-invalid={fieldErrors["recurrence.until"] ? true : undefined}
          />
          {fieldErrors["recurrence.until"] ? (
            <p id="series-until-error" className="field-error" role="alert">
              {fieldErrors["recurrence.until"]}
            </p>
          ) : null}
        </div>
      )}

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
          aria-describedby={describedBy(
            fieldErrors.capacity && "series-capacity-error",
          )}
          aria-invalid={fieldErrors.capacity ? true : undefined}
        />
        {fieldErrors.capacity ? (
          <p id="series-capacity-error" className="field-error" role="alert">
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
          aria-describedby={describedBy(
            fieldErrors.description && "series-description-error",
          )}
          aria-invalid={fieldErrors.description ? true : undefined}
        />
        {fieldErrors.description ? (
          <p id="series-description-error" className="field-error" role="alert">
            {fieldErrors.description}
          </p>
        ) : null}
      </div>

      <button type="submit" className="btn" disabled={pending || !csrf}>
        {pending ? "Creating…" : "Create series"}
      </button>
    </form>
  );
}
