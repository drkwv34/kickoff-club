export class DomainError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.details = details;
  }
}

/** Map domain errors to HTTP status in route handlers (see docs/architecture/error-handling.md). */
export function httpStatusForDomainCode(code: string): number {
  const map: Record<string, number> = {
    VALIDATION_ERROR: 400,
    INVALID_CREDENTIALS: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    LAST_ORGANIZER: 409,
    MATCH_FULL: 409,
    GONE: 410,
  };
  return map[code] ?? 500;
}
