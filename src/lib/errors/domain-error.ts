export const DomainErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  CSRF_REJECTED: "CSRF_REJECTED",
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
  [DomainErrorCode.UNAUTHENTICATED]: 401,
  [DomainErrorCode.FORBIDDEN]: 403,
  [DomainErrorCode.CSRF_REJECTED]: 403,
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
  constraint_name?: string;
};

function isPgLikeError(err: unknown): err is PgLikeError {
  return typeof err === "object" && err !== null && "code" in err;
}

function pgConstraint(err: PgLikeError): string | undefined {
  return err.constraint ?? err.constraint_name;
}

const PG_UNIQUE_VIOLATION = "23505";
const USERS_EMAIL_UNIQUE = "users_email_unique";

/**
 * Map unknown/infra errors to domain errors. Unique violations become 409
 * (FR-ERR-004) without leaking SQL to clients.
 */
export function mapUnknownError(err: unknown): DomainError {
  if (err instanceof DomainError) return err;
  if (isPgLikeError(err) && err.code === PG_UNIQUE_VIOLATION) {
    const constraint = pgConstraint(err);
    if (constraint === USERS_EMAIL_UNIQUE) {
      return new DomainError(
        DomainErrorCode.EMAIL_TAKEN,
        "Email already registered",
      );
    }
    if (constraint === "group_memberships_pk") {
      return new DomainError(
        DomainErrorCode.CONFLICT,
        "Already a member of this group",
      );
    }
    return new DomainError(
      DomainErrorCode.UNIQUE_VIOLATION,
      "Resource already exists",
      constraint ? { constraint } : undefined,
    );
  }
  return new DomainError(DomainErrorCode.INTERNAL_ERROR, "Unexpected error");
}

/** JSON body safe for clients — never includes stack traces (FR-ERR-001). */
export function toPublicErrorBody(err: DomainError): {
  code: string;
  message: string;
  fields?: Record<string, string>;
  details?: Record<string, unknown>;
} {
  const fields = asFieldMap(err.details?.fields);
  const details = omitFieldsKey(err.details);
  return {
    code: err.code,
    message: err.message,
    ...(fields ? { fields } : {}),
    ...(details ? { details } : {}),
  };
}

function asFieldMap(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") out[key] = entry;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function omitFieldsKey(
  details?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!details) return undefined;
  const rest = { ...details };
  delete rest.fields;
  return Object.keys(rest).length > 0 ? rest : undefined;
}
