import { describe, expect, it, vi } from "vitest";
import {
  DomainError,
  DomainErrorCode,
  httpStatusForDomainCode,
  mapUnknownError,
  toPublicErrorBody,
} from "../domain-error";

describe("domain error HTTP mapping", () => {
  it("maps LAST_ORGANIZER to 409", () => {
    expect(httpStatusForDomainCode(DomainErrorCode.LAST_ORGANIZER)).toBe(409);
  });

  it("maps EMAIL_TAKEN to 409", () => {
    expect(httpStatusForDomainCode(DomainErrorCode.EMAIL_TAKEN)).toBe(409);
  });

  it("maps INVALID_CREDENTIALS to 401", () => {
    expect(httpStatusForDomainCode(DomainErrorCode.INVALID_CREDENTIALS)).toBe(
      401,
    );
  });

  it("maps UNAUTHENTICATED to 401", () => {
    expect(httpStatusForDomainCode(DomainErrorCode.UNAUTHENTICATED)).toBe(401);
  });

  it("maps CSRF_REJECTED to 403", () => {
    expect(httpStatusForDomainCode(DomainErrorCode.CSRF_REJECTED)).toBe(403);
  });
});

describe("mapUnknownError", () => {
  it("maps Postgres unique violations to UNIQUE_VIOLATION without SQL text", () => {
    const mapped = mapUnknownError({
      code: "23505",
      constraint: "sessions_token_hash_unique",
      detail: "Key (token_hash)=(abc) already exists",
    });
    expect(mapped.code).toBe(DomainErrorCode.UNIQUE_VIOLATION);
    expect(mapped.message).toBe("Resource already exists");
    expect(mapped.message).not.toMatch(/Key \(/);
    expect(mapped.details).toEqual({ constraint: "sessions_token_hash_unique" });
  });

  it("maps users_email_unique to EMAIL_TAKEN from constraint_name", () => {
    const mapped = mapUnknownError({
      code: "23505",
      constraint_name: "users_email_unique",
    });
    expect(mapped.code).toBe(DomainErrorCode.EMAIL_TAKEN);
    expect(mapped.message).toBe("Email already registered");
  });

  it("passes DomainError through", () => {
    const original = new DomainError(
      DomainErrorCode.FORBIDDEN,
      "Not a member",
    );
    expect(mapUnknownError(original)).toBe(original);
  });
});

describe("toPublicErrorBody", () => {
  it("omits stack traces", () => {
    const err = new DomainError(DomainErrorCode.NOT_FOUND, "Missing");
    const body = toPublicErrorBody(err);
    expect(body).toEqual({ code: "NOT_FOUND", message: "Missing" });
    expect(JSON.stringify(body)).not.toContain("stack");
  });

  it("surfaces validation fields without extra details", () => {
    const err = new DomainError(DomainErrorCode.VALIDATION_ERROR, "Invalid request", {
      fields: { password: "Password must be at least 12 characters" },
    });
    expect(toPublicErrorBody(err)).toEqual({
      code: "VALIDATION_ERROR",
      message: "Invalid request",
      fields: { password: "Password must be at least 12 characters" },
    });
  });
});

describe("DomainError", () => {
  it("is an Error with a stable code", () => {
    const spy = vi.fn();
    spy(new DomainError(DomainErrorCode.VALIDATION_ERROR, "bad"));
    expect(spy).toHaveBeenCalled();
  });
});
