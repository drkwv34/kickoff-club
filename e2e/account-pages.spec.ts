import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { registerViaUi, uniqueEmail } from "./helpers/auth";

const ARTIFACT_DIR = path.join(process.cwd(), "e2e", "artifacts");

test.describe("account pages", () => {
  test("settings, login forgot-password link, and reset pages", async ({
    page,
  }) => {
    mkdirSync(ARTIFACT_DIR, { recursive: true });

    await page.goto("/login");
    await expect(
      page.getByRole("link", { name: "Forgot password" }),
    ).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "login-forgot-password.png"),
      fullPage: true,
    });

    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Forgot password" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "forgot-password.png"),
      fullPage: true,
    });

    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
    await expect(page.getByLabel("New password")).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "reset-password.png"),
      fullPage: true,
    });

    await registerViaUi(page, {
      email: uniqueEmail("settings"),
      displayName: "Settings User",
    });
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByLabel("Display name")).toBeVisible();
    await expect(page.getByLabel("Timezone")).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "settings-form.png"),
      fullPage: true,
    });
  });
});
