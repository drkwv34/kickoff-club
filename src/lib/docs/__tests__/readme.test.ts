import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const readme = readFileSync(
  path.resolve(__dirname, "../../../../README.md"),
  "utf8",
);

describe("README session and performance docs", () => {
  it("documents the 14-day idle and 30-day absolute session policy", () => {
    expect(readme).toMatch(/14-day idle/i);
    expect(readme).toMatch(/30-day absolute/i);
  });
});
