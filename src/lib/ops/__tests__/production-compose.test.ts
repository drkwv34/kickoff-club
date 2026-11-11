import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../../..");

describe("production Compose image", () => {
  it("uses pnpm start as the Dockerfile default command", () => {
    const dockerfile = readFileSync(path.join(root, "Dockerfile"), "utf8");
    expect(dockerfile).toMatch(/CMD\s*\[\s*"pnpm"\s*,\s*"start"\s*\]/);
    expect(dockerfile).not.toMatch(/CMD\s*\[\s*"pnpm"\s*,\s*"dev"\s*\]/);
    expect(dockerfile).toMatch(/pnpm build|next build/);
  });

  it("has a CI job that builds the image and smoke-tests /api/ready", () => {
    const workflow = readFileSync(
      path.join(root, ".github/workflows/ci.yml"),
      "utf8",
    );
    expect(workflow).toMatch(/docker compose[\s\S]*\/api\/ready|\/api\/ready[\s\S]*docker compose/);
    expect(workflow).toMatch(/\/api\/ready/);
    expect(workflow).toMatch(/docker compose/);
  });
});
