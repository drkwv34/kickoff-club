import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { registerViaUi, uniqueEmail } from "./helpers/auth";

const ARTIFACT_DIR = path.join(process.cwd(), "e2e", "artifacts");

test("series form shows field errors from a 400 response", async ({ page }) => {
  mkdirSync(ARTIFACT_DIR, { recursive: true });

  await registerViaUi(page, {
    email: uniqueEmail("series-fields"),
    displayName: "Series User",
  });
  await page.getByLabel("Group name").fill(`Series FC ${Date.now()}`);
  await page.getByRole("button", { name: "Create group" }).click();
  await page.waitForURL(/\/app\/groups\/[0-9a-f-]+$/);

  await page.getByRole("link", { name: "Create series" }).click();
  await page.waitForURL(/\/matches\/series\/new$/);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);

  await page.getByLabel("Title").fill("Weekly kickabout");
  await page.getByLabel("Venue").fill("North pitch");
  await page.getByLabel("First date (match timezone)").fill(dateStr);
  await page.getByLabel("Start time").fill("18:00");
  await page.getByLabel("End time").fill("19:00");
  await page.getByRole("button", { name: "Create series" }).click();

  await expect(page.getByText("Pick at least one weekday")).toBeVisible();
  await expect(page.locator("#series-weekdays-error")).toBeVisible();
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "form-field-errors.png"),
    fullPage: true,
  });
});
