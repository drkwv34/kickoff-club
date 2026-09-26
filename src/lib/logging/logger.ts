export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = {
  level: LogLevel;
  message: string;
  requestId?: string;
  route?: string;
  userId?: string;
  durationMs?: number;
  code?: string;
  [key: string]: unknown;
};

/** Minimal structured logger — JSON to stdout (NFR-OBS-001). */
export function log(fields: LogFields): void {
  const { level, message, ...rest } = fields;
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...rest,
  });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}
