import { describe, expect, it } from "vitest";
import { DomainError } from "@/lib/errors/domain-error";
import { instantFromWallClockInZone } from "../wall-clock";
import {
  expandWeeklyRecurrence,
  MAX_SERIES_INSTANCES,
  type WeeklyRecurrenceRule,
} from "../recurrence";

function rule(
  partial: Omit<WeeklyRecurrenceRule, "freq"> & { freq?: "weekly" },
): WeeklyRecurrenceRule {
  return { freq: "weekly", ...partial };
}

describe("expandWeeklyRecurrence", () => {
  it("expands count on a single weekday", () => {
    const tz = "America/Bogota";
    const startAt = instantFromWallClockInZone("2027-01-06", "19:00", tz);
    const endAt = instantFromWallClockInZone("2027-01-06", "21:00", tz);
    const occurrences = expandWeeklyRecurrence(startAt, endAt, tz, rule({
      interval: 1,
      byWeekday: ["WE"],
      count: 4,
    }));
    expect(occurrences).toHaveLength(4);
    expect(occurrences[0].startAt.toISOString()).toBe(startAt.toISOString());
    expect(occurrences[1].startAt.getTime() - occurrences[0].startAt.getTime()).toBe(
      7 * 24 * 60 * 60 * 1000,
    );
  });

  it("expands multiple weekdays per interval week", () => {
    const tz = "UTC";
    const startAt = instantFromWallClockInZone("2027-01-04", "10:00", tz);
    const endAt = instantFromWallClockInZone("2027-01-04", "11:00", tz);
    const occurrences = expandWeeklyRecurrence(startAt, endAt, tz, rule({
      interval: 1,
      byWeekday: ["MO", "WE"],
      count: 4,
    }));
    expect(occurrences).toHaveLength(4);
  });

  it("honors until date in match timezone", () => {
    const tz = "America/Bogota";
    const startAt = instantFromWallClockInZone("2027-01-06", "19:00", tz);
    const endAt = instantFromWallClockInZone("2027-01-06", "21:00", tz);
    const occurrences = expandWeeklyRecurrence(startAt, endAt, tz, rule({
      interval: 1,
      byWeekday: ["WE"],
      until: "2027-01-20",
    }));
    expect(occurrences.length).toBeGreaterThan(0);
    expect(occurrences.length).toBeLessThanOrEqual(3);
    for (const occ of occurrences) {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(occ.startAt);
      expect(parts <= "2027-01-20").toBe(true);
    }
  });

  it("rejects more than 52 instances", () => {
    const tz = "UTC";
    const startAt = instantFromWallClockInZone("2027-01-04", "10:00", tz);
    const endAt = instantFromWallClockInZone("2027-01-04", "11:00", tz);
    expect(() =>
      expandWeeklyRecurrence(startAt, endAt, tz, rule({
        interval: 1,
        byWeekday: ["MO"],
        count: MAX_SERIES_INSTANCES + 1,
      })),
    ).toThrow(DomainError);
  });

  it("requires anchor weekday in byWeekday", () => {
    const tz = "UTC";
    const startAt = instantFromWallClockInZone("2027-01-06", "10:00", tz);
    const endAt = instantFromWallClockInZone("2027-01-06", "11:00", tz);
    expect(() =>
      expandWeeklyRecurrence(startAt, endAt, tz, rule({
        interval: 1,
        byWeekday: ["MO"],
        count: 2,
      })),
    ).toThrow(DomainError);
  });

  it("keeps Bogota wall time across DST boundary (viewer NY)", () => {
    const tz = "America/Bogota";
    const startAt = instantFromWallClockInZone("2027-03-10", "19:00", tz);
    const endAt = instantFromWallClockInZone("2027-03-10", "21:00", tz);
    const occurrences = expandWeeklyRecurrence(startAt, endAt, tz, rule({
      interval: 1,
      byWeekday: ["WE"],
      count: 3,
    }));
    for (const occ of occurrences) {
      const wall = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(occ.startAt);
      expect(wall).toBe("19:00");
    }
  });
});
