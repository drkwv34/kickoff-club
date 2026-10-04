import type { Page } from "@playwright/test";

export const E2E_PASSWORD = "twelvechars!!";

export async function registerViaUi(
  page: Page,
  input: { email: string; displayName: string },
): Promise<void> {
  await page.goto("/register");
  await page.getByLabel("Email").fill(input.email);
  await page.getByLabel("Display name").fill(input.displayName);
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  const submit = page.getByRole("button", { name: "Create account" });
  await submit.waitFor({ state: "visible" });
  await submit.click();
  await page.waitForURL(/\/app(\/)?$/);
}

export function uniqueEmail(prefix: string): string {
  const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}-${slug}@e2e.kickoff-club.test`;
}
