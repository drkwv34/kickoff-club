export const DomainErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  LAST_ORGANIZER: "LAST_ORGANIZER",
  MATCH_FULL: "MATCH_FULL",
  CAPACITY_BELOW_RSVPS: "CAPACITY_BELOW_RSVPS",
  GONE: "GONE",
  CONFLICT: "CONFLICT",
  UNIQUE_VIOLATION: "UNIQUE_VIOLATION",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type DomainErrorCode =
  (typeof DomainErrorCode)[keyof typeof DomainErrorCode];

const HTTP_BY_CODE: Record<string, number> = {
  [DomainErrorCode.VALIDATION_ERROR]: 400,
  [DomainErrorCode.INVALID_CREDENTIALS]: 401,
  [DomainErrorCode.FORBIDDEN]: 403,
  [DomainErrorCode.NOT_FOUND]: 404,
  [DomainErrorCode.EMAIL_TAKEN]: 409,
  [DomainErrorCode.LAST_ORGANIZER]: 409,
  [DomainErrorCode.MATCH_FULL]: 409,
  [DomainErrorCode.CAPACITY_BELOW_RSVPS]: 409,
  [DomainErrorCode.CONFLICT]: 409,
  [DomainErrorCode.UNIQUE_VIOLATION]: 409,
  [DomainErrorCode.GONE]: 410,
  [DomainErrorCode.INTERNAL_ERROR]: 500,
};

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
  return HTTP_BY_CODE[code] ?? 500;
}

type PgLikeError = {
  code?: string;
  constraint?: string;
};

function isPgLikeError(err: unknown): err is PgLikeError {
  return typeof err === "object" && err !== null && "code" in err;
}

const PG_UNIQUE_VIOLATION = "23505";

/**
 * Map unknown/infra errors to domain errors. Unique violations become 409
 * (FR-ERR-004) without leaking SQL to clients.
 */
export function mapUnknownError(err: unknown): DomainError {
  if (err instanceof DomainError) return err;
  if (isPgLikeError(err) && err.code === PG_UNIQUE_VIOLATION) {
    return new DomainError(
      DomainErrorCode.UNIQUE_VIOLATION,
      "Resource already exists",
      err.constraint ? { constraint: err.constraint } : undefined,
    );
  }
  return new DomainError(DomainErrorCode.INTERNAL_ERROR, "Unexpected error");
}

/** JSON body safe for clients — never includes stack traces. */
export function toPublicErrorBody(err: DomainError): {
  code: string;
  message: string;
  details?: Record<string, unknown>;
} {
  return {
    code: err.code,
    message: err.message,
    ...(err.details ? { details: err.details } : {}),
  };
}
