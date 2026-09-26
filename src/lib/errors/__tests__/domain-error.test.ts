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
});

describe("mapUnknownError", () => {
  it("maps Postgres unique violations to UNIQUE_VIOLATION without SQL text", () => {
    const mapped = mapUnknownError({
      code: "23505",
      constraint: "users_email_unique",
      detail: "Key (email)=(a@b.c) already exists",
    });
    expect(mapped.code).toBe(DomainErrorCode.UNIQUE_VIOLATION);
    expect(mapped.message).toBe("Resource already exists");
    expect(mapped.message).not.toMatch(/Key \(/);
    expect(mapped.details).toEqual({ constraint: "users_email_unique" });
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
});

describe("DomainError", () => {
  it("is an Error with a stable code", () => {
    const spy = vi.fn();
    spy(new DomainError(DomainErrorCode.VALIDATION_ERROR, "bad"));
    expect(spy).toHaveBeenCalled();
  });
});
