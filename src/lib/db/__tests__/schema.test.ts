import { describe, expect, it } from "vitest";
import {
  CORE_TABLES,
  groupInvites,
  groupMemberships,
  groups,
  sessions,
  users,
} from "../schema";

describe("core drizzle schema", () => {
  it("exports the Day 4 tables", () => {
    expect(users).toBeDefined();
    expect(sessions).toBeDefined();
    expect(groups).toBeDefined();
    expect(groupMemberships).toBeDefined();
    expect(groupInvites).toBeDefined();
  });

  it("lists table names for migrate verify", () => {
    expect([...CORE_TABLES]).toEqual([
      "users",
      "sessions",
      "groups",
      "group_memberships",
      "group_invites",
    ]);
  });
});
