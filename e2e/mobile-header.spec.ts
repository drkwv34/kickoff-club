import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { registerViaUi, uniqueEmail } from "./helpers/auth";

const ARTIFACT_DIR = path.join(process.cwd(), "e2e", "artifacts");

async function documentOverflow(page: Page): Promise<{
  scrollWidth: number;
  clientWidth: number;
}> {
  return page.evaluate(() => {
    const root = document.documentElement;
    return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth };
  });
}

test("signed-in header does not overflow at 390x844 and 375", async ({
  browser,
}) => {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  await registerViaUi(page, {
    email: uniqueEmail("mobile-header"),
    displayName: "Mobile User",
  });
  await page.waitForURL(/\/app(\/)?$/);

  const at390 = await documentOverflow(page);
  expect(at390.scrollWidth).toBeLessThanOrEqual(at390.clientWidth);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "header-390x844.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 375, height: 812 });
  const at375 = await documentOverflow(page);
  expect(at375.scrollWidth).toBeLessThanOrEqual(at375.clientWidth);

  await context.close();
});
