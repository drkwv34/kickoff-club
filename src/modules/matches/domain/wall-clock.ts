/**
 * Convert a wall-clock date/time in an IANA zone to a UTC instant.
 * Used by UI helpers and timezone fixtures (no extra TZ library).
 */
export function instantFromWallClockInZone(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const [year, month, day] = date.split("-").map((part) => Number(part));
  const [hour, minute] = time.split(":").map((part) => Number(part));
  if (
    !year ||
    !month ||
    !day ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    throw new Error("Invalid wall clock parts");
  }

  let ms = Date.UTC(year, month - 1, day, hour, minute);
  for (let attempt = 0; attempt < 8; attempt++) {
    const parts = partsInTimeZone(new Date(ms), timeZone);
    if (parts.date === date && parts.time === time) {
      return new Date(ms);
    }
    const target = Date.UTC(year, month - 1, day, hour, minute);
    const actual = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    ms += target - actual;
  }
  return new Date(ms);
}

function partsInTimeZone(
  date: Date,
  timeZone: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  date: string;
  time: string;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
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
  const dateStr = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return { year, month, day, hour, minute, date: dateStr, time: timeStr };
}
