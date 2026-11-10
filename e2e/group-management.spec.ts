import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { registerViaUi, uniqueEmail } from "./helpers/auth";

const ARTIFACT_DIR = path.join(process.cwd(), "e2e", "artifacts");

test.describe.configure({ mode: "serial" });

test("organizer promotes, demotes, edits a match; player leaves; no-show counts show", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  mkdirSync(ARTIFACT_DIR, { recursive: true });

  const organizerContext = await browser.newContext();
  const playerContext = await browser.newContext();
  const organizer = await organizerContext.newPage();
  const player = await playerContext.newPage();

  const organizerEmail = uniqueEmail("mgmt-org");
  const playerEmail = uniqueEmail("mgmt-player");
  const groupName = `Manage FC ${Date.now()}`;

  await registerViaUi(organizer, {
    email: organizerEmail,
    displayName: "Organizer",
  });

  await organizer.getByLabel("Group name").fill(groupName);
  await organizer.getByRole("button", { name: "Create group" }).click();
  await organizer.waitForURL(/\/app\/groups\/[0-9a-f-]+$/);
  const groupUrl = organizer.url();
  const groupId = groupUrl.split("/").pop()!;

  await organizer.getByRole("button", { name: "Create invite link" }).click();
  const inviteCodes = organizer.locator(".invite-result code");
  await expect(inviteCodes).toHaveCount(2);
  const inviteCode = (await inviteCodes.nth(1).textContent())!.trim();

  await organizer.getByRole("link", { name: "Create match" }).click();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);
  await organizer.getByLabel("Title").fill("Pickup derby");
  await organizer.getByLabel("Venue").fill("East pitch");
  await organizer.getByLabel("Date (match timezone)").fill(dateStr);
  await organizer.getByLabel("Start time").fill("18:00");
  await organizer.getByLabel("End time").fill("19:00");
  await organizer.getByRole("button", { name: "Create match" }).click();
  await organizer.waitForURL(/\/app\/matches\/[0-9a-f-]+$/);
  const matchUrl = organizer.url();

  await registerViaUi(player, {
    email: playerEmail,
    displayName: "Player",
  });
  await player.goto(`/invite/${inviteCode}`);
  await player.getByRole("button", { name: `Join ${groupName}` }).click();
  await player.waitForURL(`/app/groups/${groupId}`);

  await organizer.goto(groupUrl);
  const members = organizer.getByRole("list", { name: "Members" });
  await expect(members.getByText(/0 no-shows/)).toHaveCount(2);

  await organizer
    .getByRole("listitem")
    .filter({ hasText: "Organizer" })
    .getByRole("button", { name: "Leave group" })
    .click();
  await expect(organizer.getByText(/last organizer/i)).toBeVisible();

  await organizer
    .getByRole("listitem")
    .filter({ hasText: "Player" })
    .getByRole("button", { name: "Promote" })
    .click();
  await expect(
    organizer.getByRole("listitem").filter({ hasText: "Player" }).getByText(/organizer/i),
  ).toBeVisible();

  await organizer
    .getByRole("listitem")
    .filter({ hasText: "Player" })
    .getByRole("button", { name: "Demote" })
    .click();
  await expect(
    organizer.getByRole("listitem").filter({ hasText: "Player" }).getByText(/player/i),
  ).toBeVisible();

  await organizer.screenshot({
    path: path.join(ARTIFACT_DIR, "member-management.png"),
    fullPage: true,
  });

  await organizer.goto(matchUrl);
  await organizer.getByRole("link", { name: "Edit match" }).click();
  await organizer.waitForURL(`/app/matches/${matchUrl.split("/").pop()}/edit`);
  await expect(organizer.getByLabel("Title")).toBeVisible();
  await organizer.screenshot({
    path: path.join(ARTIFACT_DIR, "edit-match-form.png"),
    fullPage: true,
  });
  await organizer.getByLabel("Venue").fill("West pitch");
  await organizer.getByRole("button", { name: "Save match" }).click();
  await organizer.waitForURL(matchUrl);
  await expect(organizer.getByText(/West pitch/)).toBeVisible();

  await player.goto(groupUrl);
  await player.getByRole("button", { name: "Leave group" }).click();
  await player.waitForURL(/\/app(\/)?$/);

  await organizer.goto(groupUrl);
  await expect(
    organizer.getByRole("listitem").filter({ hasText: "Player" }),
  ).toHaveCount(0);

  await organizerContext.close();
  await playerContext.close();
});
