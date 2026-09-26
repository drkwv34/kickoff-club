import { describe, expect, it } from "vitest";
import { httpStatusForDomainCode } from "../errors/domain-error";

describe("domain error HTTP mapping", () => {
  it("maps LAST_ORGANIZER to 409", () => {
    expect(httpStatusForDomainCode("LAST_ORGANIZER")).toBe(409);
  });
});
