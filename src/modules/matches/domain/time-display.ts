/**
 * Wall-clock formatting for match times (FR-MATCH-005).
 * Uses Intl — no extra TZ dependency.
 */

const WALL_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

export function formatWallClock(
  instant: Date | string,
  timeZone: string,
): string {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  return new Intl.DateTimeFormat("en-US", {
    ...WALL_FORMAT,
    timeZone,
  }).format(date);
}

export function timeZoneLabelsDiffer(
  matchTimeZone: string,
  viewerTimeZone: string,
): boolean {
  return matchTimeZone !== viewerTimeZone;
}

export type MatchTimePresentation = {
  matchWall: string;
  viewerWall: string | null;
  viewerTimeZone: string;
  matchTimeZone: string;
};

/** Primary label in match TZ; optional viewer conversion when zones differ. */
export function presentMatchTimes(input: {
  startAt: Date | string;
  endAt: Date | string;
  matchTimeZone: string;
  viewerTimeZone: string;
}): {
  start: MatchTimePresentation;
  end: MatchTimePresentation;
} {
  const start = presentSingle(
    input.startAt,
    input.matchTimeZone,
    input.viewerTimeZone,
  );
  const end = presentSingle(
    input.endAt,
    input.matchTimeZone,
    input.viewerTimeZone,
  );
  return { start, end };
}

function presentSingle(
  instant: Date | string,
  matchTimeZone: string,
  viewerTimeZone: string,
): MatchTimePresentation {
  const matchWall = formatWallClock(instant, matchTimeZone);
  const differs = timeZoneLabelsDiffer(matchTimeZone, viewerTimeZone);
  return {
    matchWall,
    matchTimeZone,
    viewerTimeZone,
    viewerWall: differs
      ? formatWallClock(instant, viewerTimeZone)
      : null,
  };
}
