import { describe, expect, it } from "vitest";
import {
  formatWallClock,
  presentMatchTimes,
  timeZoneLabelsDiffer,
} from "../time-display";
import { instantFromWallClockInZone } from "../wall-clock";

describe("time-display (FR-MATCH-005)", () => {
  const bogota = "America/Bogota";
  const newYork = "America/New_York";

  it("keeps 19:00 wall time in America/Bogota when formatted in match TZ", () => {
    const start = instantFromWallClockInZone("2026-03-15", "19:00", bogota);
    const end = instantFromWallClockInZone("2026-03-15", "21:00", bogota);

    expect(formatWallClock(start, bogota)).toMatch(/7:00\s*PM/);
    expect(formatWallClock(end, bogota)).toMatch(/9:00\s*PM/);

    const listedAgain = formatWallClock(start.toISOString(), bogota);
    expect(listedAgain).toMatch(/7:00\s*PM/);
  });

  it("shows New York conversion during EDT (summer)", () => {
    const start = instantFromWallClockInZone("2026-07-15", "19:00", bogota);
    expect(timeZoneLabelsDiffer(bogota, newYork)).toBe(true);

    const nyWall = formatWallClock(start, newYork);
    expect(nyWall).toMatch(/8:00\s*PM/);

    const presentation = presentMatchTimes({
      startAt: start,
      endAt: instantFromWallClockInZone("2026-07-15", "21:00", bogota),
      matchTimeZone: bogota,
      viewerTimeZone: newYork,
    });
    expect(presentation.start.matchWall).toMatch(/7:00\s*PM/);
    expect(presentation.start.viewerWall).toMatch(/8:00\s*PM/);
    expect(presentation.start.viewerWall).not.toBeNull();
  });

  it("shows New York conversion during EST (winter DST case)", () => {
    const start = instantFromWallClockInZone("2026-01-15", "19:00", bogota);
    const nyWall = formatWallClock(start, newYork);
    expect(nyWall).toMatch(/7:00\s*PM/);

    const presentation = presentMatchTimes({
      startAt: start,
      endAt: instantFromWallClockInZone("2026-01-15", "21:00", bogota),
      matchTimeZone: bogota,
      viewerTimeZone: newYork,
    });
    expect(presentation.start.viewerWall).toMatch(/7:00\s*PM/);
  });
});
