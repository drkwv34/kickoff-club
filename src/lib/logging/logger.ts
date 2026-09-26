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

const REDACT_KEYS = new Set([
  "password",
  "passwordhash",
  "password_hash",
  "token",
  "tokenhash",
  "token_hash",
  "sessiontoken",
  "session_token",
  "authorization",
  "cookie",
  "session_secret",
  "sessionsecret",
]);

function redactValue(key: string, value: unknown): unknown {
  if (REDACT_KEYS.has(key.toLowerCase())) return "[redacted]";
  return value;
}

export function redactFields(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = redactValue(key, value);
  }
  return out;
}

export function newRequestId(): string {
  return crypto.randomUUID();
}

function writeLine(level: LogLevel, line: string): void {
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

/** Structured JSON logger — one object per line (NFR-OBS-001). */
export function log(fields: LogFields): void {
  const { level, message, ...rest } = fields;
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...redactFields(rest),
  });
  writeLine(level, line);
}

export type Logger = {
  debug: (message: string, extra?: Record<string, unknown>) => void;
  info: (message: string, extra?: Record<string, unknown>) => void;
  warn: (message: string, extra?: Record<string, unknown>) => void;
  error: (message: string, extra?: Record<string, unknown>) => void;
};

export function createLogger(
  base: Partial<Omit<LogFields, "level" | "message">> = {},
): Logger {
  const emit = (
    level: LogLevel,
    message: string,
    extra?: Record<string, unknown>,
  ) => {
    log({ ...base, ...extra, level, message });
  };
  return {
    debug: (message, extra) => emit("debug", message, extra),
    info: (message, extra) => emit("info", message, extra),
    warn: (message, extra) => emit("warn", message, extra),
    error: (message, extra) => emit("error", message, extra),
  };
}
