import { describe, expect, it } from "vitest";
import {
  CORE_TABLES,
  groupInvites,
  groupMemberships,
  groups,
  matches,
  sessions,
  users,
} from "../schema";

describe("core drizzle schema", () => {
  it("exports the core tables", () => {
    expect(users).toBeDefined();
    expect(sessions).toBeDefined();
    expect(groups).toBeDefined();
    expect(groupMemberships).toBeDefined();
    expect(groupInvites).toBeDefined();
    expect(matches).toBeDefined();
  });

  it("lists table names for migrate verify", () => {
    expect([...CORE_TABLES]).toEqual([
      "users",
      "sessions",
      "groups",
      "group_memberships",
      "group_invites",
      "matches",
    ]);
  });
});
