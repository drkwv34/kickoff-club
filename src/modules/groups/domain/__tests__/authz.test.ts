import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  assertNotLastOrganizer,
  canDemoteOrganizer,
  canPerformGroupAction,
  requireMember,
  requireOrganizer,
  type GroupAction,
} from "../authz";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import type { MembershipRecord, MembershipRole } from "../types";

function membership(role: MembershipRole): MembershipRecord {
  return {
    groupId: "g1",
    userId: "u1",
    role,
    noShowCount: 0,
    joinedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

const actions: GroupAction[] = [
  "create_group",
  "view",
  "invite",
  "manage_roles",
  "leave",
];

describe("group authz matrix", () => {
  const cases: Array<{
    actor: string;
    role: MembershipRole | null;
    organizerCount: number;
    allowed: GroupAction[];
  }> = [
    {
      actor: "anonymous / no membership",
      role: null,
      organizerCount: 1,
      allowed: ["create_group"],
    },
    {
      actor: "player",
      role: "player",
      organizerCount: 1,
      allowed: ["create_group", "view", "leave"],
    },
    {
      actor: "organizer (not last)",
      role: "organizer",
      organizerCount: 2,
      allowed: ["create_group", "view", "invite", "manage_roles", "leave"],
    },
    {
      actor: "last organizer",
      role: "organizer",
      organizerCount: 1,
      allowed: ["create_group", "view", "invite", "manage_roles"],
    },
  ];

  for (const row of cases) {
    it(`${row.actor} is allowed ${row.allowed.join(", ") || "(nothing)"}`, () => {
      for (const action of actions) {
        const allowed = canPerformGroupAction({
          action,
          role: row.role,
          organizerCount: row.organizerCount,
        });
        expect(allowed, action).toBe(row.allowed.includes(action));
      }
    });
  }

  it("forbids demoting the last organizer", () => {
    expect(canDemoteOrganizer(1)).toBe(false);
    expect(canDemoteOrganizer(2)).toBe(true);
    expect(() => assertNotLastOrganizer("organizer", 1)).toThrowError(DomainError);
    try {
      assertNotLastOrganizer("organizer", 1);
    } catch (err) {
      expect(err).toBeInstanceOf(DomainError);
      expect((err as DomainError).code).toBe(DomainErrorCode.LAST_ORGANIZER);
    }
    expect(() => assertNotLastOrganizer("player", 1)).not.toThrow();
    expect(() => assertNotLastOrganizer("organizer", 2)).not.toThrow();
  });

  it("requireMember / requireOrganizer throw FORBIDDEN", () => {
    expect(() => requireMember(null)).toThrowError(DomainError);
    try {
      requireMember(null);
    } catch (err) {
      expect((err as DomainError).code).toBe(DomainErrorCode.FORBIDDEN);
    }
    expect(() => requireOrganizer(membership("player"))).toThrowError(DomainError);
    expect(requireOrganizer(membership("organizer")).role).toBe("organizer");
  });
});

describe("groups domain isolation", () => {
  it("does not import react or next", () => {
    const root = path.join(process.cwd(), "src/modules/groups/domain");
    const files = walkTs(root);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      expect(src, file).not.toMatch(/from\s+["']react["']/);
      expect(src, file).not.toMatch(/from\s+["']next(\/[^"']*)?["']/);
    }
  });
});

function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walkTs(full));
    } else if (full.endsWith(".ts") && !full.includes(".test.")) {
      out.push(full);
    }
  }
  return out;
}
