import { expect, test } from "@playwright/test";
import { registerViaUi, uniqueEmail } from "./helpers/auth";
import { backdateMatchToStarted } from "./helpers/db";

test.describe.configure({ mode: "serial" });

test("register → group → match → waitlist promotion → no-show", async ({
  browser,
}) => {
  const organizerContext = await browser.newContext();
  const playerContext = await browser.newContext();
  const organizer = await organizerContext.newPage();
  const player = await playerContext.newPage();

  organizer.on("dialog", (dialog) => dialog.accept());

  const organizerEmail = uniqueEmail("organizer");
  const playerEmail = uniqueEmail("player");
  const groupName = `E2E FC ${Date.now()}`;

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
  await organizer.waitForURL(`/app/groups/${groupId}/matches/new`);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);

  await organizer.getByLabel("Title").fill("Waitlist derby");
  await organizer.getByLabel("Venue").fill("Test pitch");
  await organizer.getByLabel("Date (match timezone)").fill(dateStr);
  await organizer.getByLabel("Start time").fill("18:00");
  await organizer.getByLabel("End time").fill("19:00");
  await organizer.getByLabel("Capacity").fill("1");
  await organizer.getByRole("button", { name: "Create match" }).click();
  await organizer.waitForURL(/\/app\/matches\/[0-9a-f-]+$/);
  const waitlistMatchUrl = organizer.url();

  await organizer.getByRole("button", { name: "Going" }).click();
  await expect(organizer.getByText("You are going")).toBeVisible();

  await registerViaUi(player, {
    email: playerEmail,
    displayName: "Player",
  });
  await player.goto(`/invite/${inviteCode}`);
  await player.getByRole("button", { name: `Join ${groupName}` }).click();
  await player.waitForURL(`/app/groups/${groupId}`);

  await player.goto(waitlistMatchUrl);
  await player.getByRole("button", { name: "Going" }).click();
  await expect(player.getByText(/You are on the waitlist/)).toBeVisible();
  await expect(player.getByText(/position 1/)).toBeVisible();

  await organizer.goto(waitlistMatchUrl);
  await organizer.getByRole("button", { name: "Cancel RSVP" }).click();
  await expect(organizer.getByText(/You have not RSVP/)).toBeVisible();

  await player.reload();
  await expect(player.getByText("You are going")).toBeVisible();
  await expect(player.getByText(/on the waitlist/i)).not.toBeVisible();

  await organizer.goto(`/app/groups/${groupId}`);
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

  await player.goto(noShowMatchUrl);
  await player.getByRole("button", { name: "Going" }).click();
  await expect(player.getByText("You are going")).toBeVisible();

  await backdateMatchToStarted(noShowMatchId);

  await organizer.goto(noShowMatchUrl);
  await expect(organizer.getByRole("heading", { name: "Mark no-show" })).toBeVisible();
  await organizer.locator("#no-show-player").selectOption({ label: "Player" });
  await organizer.getByRole("button", { name: "Mark no-show" }).click();
  await expect(organizer.getByText(/No-show recorded/)).toBeVisible();

  await organizerContext.close();
  await playerContext.close();
});
