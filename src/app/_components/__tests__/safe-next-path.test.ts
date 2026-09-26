import { describe, expect, it } from "vitest";
import { safeNextPath } from "../safe-next-path";

describe("safeNextPath", () => {
  it("allows relative app paths", () => {
    expect(safeNextPath("/invite/abc")).toBe("/invite/abc");
    expect(safeNextPath("/app/groups/1")).toBe("/app/groups/1");
  });

  it("rejects open redirects", () => {
    expect(safeNextPath("https://evil.example")).toBe("/app");
    expect(safeNextPath("//evil.example")).toBe("/app");
    expect(safeNextPath("app")).toBe("/app");
    expect(safeNextPath(null)).toBe("/app");
  });
});
