import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { registerViaUi, uniqueEmail } from "./helpers/auth";
import { backdateMatchToStarted } from "./helpers/db";

const ARTIFACT_DIR = path.join(process.cwd(), "e2e", "artifacts");

test.describe.configure({ mode: "serial" });

test("notification preferences, match filters, and unmark no-show", async ({
  browser,
}) => {
  mkdirSync(ARTIFACT_DIR, { recursive: true });

  const organizerContext = await browser.newContext();
  const playerContext = await browser.newContext();
  const organizer = await organizerContext.newPage();
  const player = await playerContext.newPage();

  const organizerEmail = uniqueEmail("prefs-org");
  const playerEmail = uniqueEmail("prefs-player");
  const groupName = `Filters FC ${Date.now()}`;

  await registerViaUi(organizer, {
    email: organizerEmail,
    displayName: "Organizer",
  });

  await organizer.getByRole("link", { name: "Notifications" }).click();
  await organizer.waitForURL("/app/notifications");
  await expect(
    organizer.getByRole("heading", { name: "Notification preferences" }),
  ).toBeVisible();
  await expect(organizer.getByLabel("In-app").first()).toBeVisible();
  await expect(organizer.getByLabel("Email").first()).toBeVisible();
  await organizer.screenshot({
    path: path.join(ARTIFACT_DIR, "notification-preferences.png"),
    fullPage: true,
  });

  await organizer.goto("/app");
  await organizer.getByLabel("Group name").fill(groupName);
  await organizer.getByRole("button", { name: "Create group" }).click();
  await organizer.waitForURL(/\/app\/groups\/[0-9a-f-]+$/);
  const groupUrl = organizer.url();
  const groupId = groupUrl.split("/").pop()!;

  await expect(organizer.getByLabel("When")).toBeVisible();
  await expect(organizer.getByLabel("Status")).toBeVisible();
  await expect(organizer.getByLabel("From")).toBeVisible();
  await expect(organizer.getByLabel("To")).toBeVisible();
  await expect(
    organizer.getByRole("button", { name: "Apply filters" }),
  ).toBeVisible();

  await organizer.getByRole("link", { name: "Create match" }).click();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);
  await organizer.getByLabel("Title").fill("Filter derby");
  await organizer.getByLabel("Venue").fill("Test pitch");
  await organizer.getByLabel("Date (match timezone)").fill(dateStr);
  await organizer.getByLabel("Start time").fill("18:00");
  await organizer.getByLabel("End time").fill("19:00");
  await organizer.getByRole("button", { name: "Create match" }).click();
  await organizer.waitForURL(/\/app\/matches\/[0-9a-f-]+$/);

  await organizer.goto(groupUrl);
  await organizer.getByLabel("When").selectOption("upcoming");
  await organizer.getByRole("button", { name: "Apply filters" }).click();
  await expect(organizer.getByRole("link", { name: "Filter derby" })).toBeVisible();
  await organizer.screenshot({
    path: path.join(ARTIFACT_DIR, "match-list-filters.png"),
    fullPage: true,
  });

  await organizer.getByRole("button", { name: "Create invite link" }).click();
  const inviteCodes = organizer.locator(".invite-result code");
  await expect(inviteCodes).toHaveCount(2);
  const inviteCode = (await inviteCodes.nth(1).textContent())!.trim();

  await organizer.getByRole("link", { name: "Create match" }).click();
  await organizer.getByLabel("Title").fill("No-show check");
  await organizer.getByLabel("Venue").fill("Test pitch");
  await organizer.getByLabel("Date (match timezone)").fill(dateStr);
  await organizer.getByLabel("Start time").fill("20:00");
  await organizer.getByLabel("End time").fill("21:00");
  await organizer.getByRole("button", { name: "Create match" }).click();
  await organizer.waitForURL(/\/app\/matches\/[0-9a-f-]+$/);
  const noShowMatchId = organizer.url().split("/").pop()!;
  const noShowMatchUrl = organizer.url();

  await registerViaUi(player, {
    email: playerEmail,
    displayName: "Player",
  });
  await player.goto(`/invite/${inviteCode}`);
  await player.getByRole("button", { name: `Join ${groupName}` }).click();
  await player.waitForURL(`/app/groups/${groupId}`);
  await player.goto(noShowMatchUrl);
  await player.getByRole("button", { name: "Going" }).click();
  await expect(player.getByText("You are going")).toBeVisible();

  await backdateMatchToStarted(noShowMatchId);
  await organizer.goto(noShowMatchUrl);
  await expect(organizer.getByRole("heading", { name: "Mark no-show" })).toBeVisible();
  await organizer.locator("#no-show-player").selectOption({ label: "Player" });
  await organizer.getByRole("button", { name: "Mark no-show" }).click();
  await expect(organizer.getByText(/No-show recorded/)).toBeVisible();
  await organizer.reload();
  await expect(organizer.getByRole("button", { name: "Unmark no-show" })).toBeVisible();
  await organizer.screenshot({
    path: path.join(ARTIFACT_DIR, "unmark-no-show.png"),
    fullPage: true,
  });

  await organizerContext.close();
  await playerContext.close();
});
