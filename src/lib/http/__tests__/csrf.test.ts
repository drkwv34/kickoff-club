import { describe, expect, it } from "vitest";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { CSRF_COOKIE_NAME } from "../cookies";
import { assertCsrf } from "../csrf";

function requestWith(headers: Record<string, string>): Request {
  return new Request("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers,
  });
}

describe("assertCsrf", () => {
  it("rejects missing tokens with 403 CSRF_REJECTED", () => {
    expect(() => assertCsrf(requestWith({}))).toThrow(DomainError);
    try {
      assertCsrf(requestWith({}));
    } catch (err) {
      expect(err).toMatchObject({
        code: DomainErrorCode.CSRF_REJECTED,
      });
    }
  });

  it("rejects mismatched cookie vs header", () => {
    expect(() =>
      assertCsrf(
        requestWith({
          cookie: `${CSRF_COOKIE_NAME}=aaa`,
          "x-csrf-token": "bbb",
        }),
      ),
    ).toThrow(DomainError);
  });

  it("accepts matching double-submit tokens", () => {
    expect(() =>
      assertCsrf(
        requestWith({
          cookie: `${CSRF_COOKIE_NAME}=same-token`,
          "x-csrf-token": "same-token",
          origin: "http://localhost:3000",
        }),
      ),
    ).not.toThrow();
  });
});
