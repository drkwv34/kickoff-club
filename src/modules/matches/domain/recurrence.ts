import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { instantFromWallClockInZone } from "./wall-clock";
import {
  RECURRENCE_TOO_MANY_INSTANCES_MESSAGE,
  RECURRENCE_EMPTY_MESSAGE,
  RECURRENCE_START_WEEKDAY_MESSAGE,
} from "./messages";

export const WEEKDAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const MAX_SERIES_INSTANCES = 52;
export const MIN_SERIES_COUNT = 1;
export const MAX_SERIES_COUNT = 52;
export const MIN_WEEKLY_INTERVAL = 1;
export const MAX_WEEKLY_INTERVAL = 4;

export type WeeklyRecurrenceRule = {
  freq: "weekly";
  interval: number;
  byWeekday: Weekday[];
  count?: number;
  until?: string;
};

export type ExpandedOccurrence = {
  startAt: Date;
  endAt: Date;
};

const WEEKDAY_TO_ISO: Record<Weekday, number> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 7,
};

type LocalParts = {
  year: number;
  month: number;
  day: number;
  time: string;
  date: string;
};

function wallParts(instant: Date, timeZone: string): LocalParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(instant);
  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const year = Number(lookup.year);
  const month = Number(lookup.month);
  const day = Number(lookup.day);
  let hour = Number(lookup.hour);
  if (hour === 24) hour = 0;
  const minute = Number(lookup.minute);
  const date = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return { year, month, day, time, date };
}

function isoWeekdayFromLocalDate(year: number, month: number, day: number): number {
  const utc = new Date(Date.UTC(year, month - 1, day));
  const dow = utc.getUTCDay();
  return dow === 0 ? 7 : dow;
}

function weekdayFromLocalDate(
  year: number,
  month: number,
  day: number,
): Weekday {
  const iso = isoWeekdayFromLocalDate(year, month, day);
  const entry = Object.entries(WEEKDAY_TO_ISO).find(([, value]) => value === iso);
  if (!entry) {
    throw new Error("invalid weekday");
  }
  return entry[0] as Weekday;
}

function addLocalDays(
  year: number,
  month: number,
  day: number,
  days: number,
): { year: number; month: number; day: number; date: string } {
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth() + 1;
  const d = shifted.getUTCDate();
  const date = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { year: y, month: m, day: d, date };
}

function mondayOnOrBefore(year: number, month: number, day: number) {
  const iso = isoWeekdayFromLocalDate(year, month, day);
  return addLocalDays(year, month, day, -(iso - 1));
}

function assertMaxInstances(count: number): void {
  if (count > MAX_SERIES_INSTANCES) {
    throw new DomainError(
      DomainErrorCode.VALIDATION_ERROR,
      RECURRENCE_TOO_MANY_INSTANCES_MESSAGE,
    );
  }
}

/**
 * Expand a weekly recurrence into concrete start/end instants (materialized up front).
 */
export function expandWeeklyRecurrence(
  anchorStart: Date,
  anchorEnd: Date,
  timeZone: string,
  rule: WeeklyRecurrenceRule,
): ExpandedOccurrence[] {
  if (anchorEnd.getTime() <= anchorStart.getTime()) {
    throw new DomainError(
      DomainErrorCode.VALIDATION_ERROR,
      "End time must be after start time",
    );
  }

  const durationMs = anchorEnd.getTime() - anchorStart.getTime();
  const anchorParts = wallParts(anchorStart, timeZone);
  const anchorWeekday = weekdayFromLocalDate(
    anchorParts.year,
    anchorParts.month,
    anchorParts.day,
  );
  if (!rule.byWeekday.includes(anchorWeekday)) {
    throw new DomainError(
      DomainErrorCode.VALIDATION_ERROR,
      RECURRENCE_START_WEEKDAY_MESSAGE,
    );
  }

  const sortedWeekdays = [...rule.byWeekday].sort(
    (a, b) => WEEKDAY_TO_ISO[a] - WEEKDAY_TO_ISO[b],
  );
  const anchorMonday = mondayOnOrBefore(
    anchorParts.year,
    anchorParts.month,
    anchorParts.day,
  );

  const results: ExpandedOccurrence[] = [];
  const targetCount = rule.count;
  const untilDate = rule.until;

  for (let weekIndex = 0; weekIndex < 520; weekIndex++) {
    const weekStart = addLocalDays(
      anchorMonday.year,
      anchorMonday.month,
      anchorMonday.day,
      weekIndex * rule.interval * 7,
    );

    if (untilDate && weekStart.date > untilDate) {
      break;
    }

    for (const weekday of sortedWeekdays) {
      const iso = WEEKDAY_TO_ISO[weekday];
      const occLocal = addLocalDays(
        weekStart.year,
        weekStart.month,
        weekStart.day,
        iso - 1,
      );

      if (untilDate && occLocal.date > untilDate) {
        continue;
      }

      const startAt = instantFromWallClockInZone(
        occLocal.date,
        anchorParts.time,
        timeZone,
      );
      if (startAt.getTime() < anchorStart.getTime()) {
        continue;
      }

      results.push({
        startAt,
        endAt: new Date(startAt.getTime() + durationMs),
      });

      if (targetCount !== undefined && results.length >= targetCount) {
        assertMaxInstances(results.length);
        return results;
      }
    }
  }

  if (results.length === 0) {
    throw new DomainError(
      DomainErrorCode.VALIDATION_ERROR,
      RECURRENCE_EMPTY_MESSAGE,
    );
  }

  if (targetCount !== undefined && results.length !== targetCount) {
    throw new DomainError(
      DomainErrorCode.VALIDATION_ERROR,
      RECURRENCE_EMPTY_MESSAGE,
    );
  }

  assertMaxInstances(results.length);
  return results;
}
