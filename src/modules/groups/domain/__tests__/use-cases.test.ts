import { describe, expect, it } from "vitest";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { acceptInvite, previewInvite } from "../accept-invite";
import { changeMemberRole } from "../change-role";
import { createGroup } from "../create-group";
import { createInvite } from "../create-invite";
import { getGroupDetail } from "../get-group";
import { leaveGroup } from "../leave-group";
import { listGroupsForUser } from "../list-groups";
import type {
  GroupRepository,
  GroupsDeps,
  GroupStores,
  InviteRepository,
  MembershipRepository,
} from "../ports";
import type {
  GroupRecord,
  InviteRecord,
  MembershipRecord,
} from "../types";

function memoryDeps(start = new Date("2026-03-01T12:00:00.000Z")): GroupsDeps & {
  setNow: (d: Date) => void;
} {
  const groupStore: GroupRecord[] = [];
  const memberStore: Array<MembershipRecord & { displayName: string }> = [];
  const inviteStore: InviteRecord[] = [];
  let now = start;
  let seq = 1;

  const groups: GroupRepository = {
    async create(input) {
      const group: GroupRecord = {
        id: `group-${seq++}`,
        name: input.name,
        sportDefault: input.sportDefault,
        homeTimezone: input.homeTimezone,
        description: input.description,
        createdBy: input.createdBy,
        createdAt: now,
      };
      groupStore.push(group);
      return group;
    },
    async findById(id) {
      return groupStore.find((g) => g.id === id) ?? null;
    },
  };

  const memberships: MembershipRepository = {
    async create(input) {
      if (
        memberStore.some(
          (m) => m.groupId === input.groupId && m.userId === input.userId,
        )
      ) {
        throw new DomainError(DomainErrorCode.CONFLICT, "Already a member of this group");
      }
      const row: MembershipRecord & { displayName: string } = {
        groupId: input.groupId,
        userId: input.userId,
        role: input.role,
        noShowCount: 0,
        joinedAt: now,
        displayName: input.userId,
      };
      memberStore.push(row);
      return row;
    },
    async find(groupId, userId) {
      return (
        memberStore.find((m) => m.groupId === groupId && m.userId === userId) ??
        null
      );
    },
    async listByUserId(userId) {
      return memberStore
        .filter((m) => m.userId === userId)
        .map((membership) => ({
          group: groupStore.find((g) => g.id === membership.groupId)!,
          membership,
        }));
    },
    async listMembers(groupId) {
      return memberStore.filter((m) => m.groupId === groupId);
    },
    async lockGroupAndCountOrganizers(groupId) {
      return memberStore.filter(
        (m) => m.groupId === groupId && m.role === "organizer",
      ).length;
    },
    async updateRole(groupId, userId, role) {
      const row = memberStore.find(
        (m) => m.groupId === groupId && m.userId === userId,
      );
      if (!row) {
        throw new DomainError(DomainErrorCode.NOT_FOUND, "Member not found");
      }
      row.role = role;
      return row;
    },
    async delete(groupId, userId) {
      const idx = memberStore.findIndex(
        (m) => m.groupId === groupId && m.userId === userId,
      );
      if (idx >= 0) memberStore.splice(idx, 1);
    },
  };

  const invites: InviteRepository = {
    async create(input) {
      const invite: InviteRecord = {
        id: `invite-${seq++}`,
        groupId: input.groupId,
        code: input.code,
        createdBy: input.createdBy,
        expiresAt: input.expiresAt,
        maxUses: input.maxUses,
        useCount: 0,
        createdAt: now,
      };
      inviteStore.push(invite);
      return invite;
    },
    async findByCode(code) {
      return inviteStore.find((i) => i.code === code) ?? null;
    },
    async findByCodeForUpdate(code) {
      return inviteStore.find((i) => i.code === code) ?? null;
    },
    async incrementUseCount(id) {
      const invite = inviteStore.find((i) => i.id === id);
      if (!invite) {
        throw new DomainError(DomainErrorCode.NOT_FOUND, "Invite not found");
      }
      invite.useCount += 1;
      return invite;
    },
  };

  const stores: GroupStores = { groups, memberships, invites };

  return {
    ...stores,
    clock: () => now,
    randomCode: () => `code-${seq++}`,
    runInTransaction: async (work) => work(stores),
    setNow: (d) => {
      now = d;
    },
  };
}

describe("groups use-cases", () => {
  it("makes the creator an organizer", async () => {
    const deps = memoryDeps();
    const created = await createGroup(
      {
        actorId: "alice",
        name: "Tuesday Futbol",
        sportDefault: "futbol",
        homeTimezone: "America/Bogota",
        description: null,
      },
      deps,
    );
    expect(created.role).toBe("organizer");
    const listed = await listGroupsForUser("alice", deps);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.role).toBe("organizer");
  });

  it("joins an invitee as a player", async () => {
    const deps = memoryDeps();
    const created = await createGroup(
      {
        actorId: "alice",
        name: "Tuesday Futbol",
        sportDefault: "futbol",
        homeTimezone: "America/Bogota",
        description: null,
      },
      deps,
    );
    const invite = await createInvite(
      { groupId: created.group.id, actorId: "alice", maxUses: 5 },
      deps,
    );
    const joined = await acceptInvite(invite.code, "bob", deps);
    expect(joined.role).toBe("player");
    const detail = await getGroupDetail(created.group.id, "alice", deps);
    expect(detail.members.map((m) => m.userId).sort()).toEqual(["alice", "bob"]);
  });

  it("rejects expired invites with GONE", async () => {
    const deps = memoryDeps(new Date("2026-03-01T00:00:00.000Z"));
    const created = await createGroup(
      {
        actorId: "alice",
        name: "Club",
        sportDefault: "futbol",
        homeTimezone: "America/Bogota",
        description: null,
      },
      deps,
    );
    const invite = await createInvite(
      { groupId: created.group.id, actorId: "alice" },
      deps,
    );
    deps.setNow(new Date("2026-03-10T00:00:00.000Z"));
    await expect(previewInvite(invite.code, deps)).rejects.toMatchObject({
      code: DomainErrorCode.GONE,
    });
    await expect(acceptInvite(invite.code, "bob", deps)).rejects.toMatchObject({
      code: DomainErrorCode.GONE,
    });
  });

  it("rejects a second use of a single-use invite", async () => {
    const deps = memoryDeps();
    const created = await createGroup(
      {
        actorId: "alice",
        name: "Club",
        sportDefault: "futbol",
        homeTimezone: "America/Bogota",
        description: null,
      },
      deps,
    );
    const invite = await createInvite(
      { groupId: created.group.id, actorId: "alice", maxUses: 1 },
      deps,
    );
    await acceptInvite(invite.code, "bob", deps);
    await expect(acceptInvite(invite.code, "cara", deps)).rejects.toMatchObject({
      code: DomainErrorCode.GONE,
    });
  });

  it("returns LAST_ORGANIZER when demoting the last organizer", async () => {
    const deps = memoryDeps();
    const created = await createGroup(
      {
        actorId: "alice",
        name: "Club",
        sportDefault: "futbol",
        homeTimezone: "America/Bogota",
        description: null,
      },
      deps,
    );
    await expect(
      changeMemberRole(
        {
          groupId: created.group.id,
          actorId: "alice",
          targetUserId: "alice",
          role: "player",
        },
        deps,
      ),
    ).rejects.toMatchObject({ code: DomainErrorCode.LAST_ORGANIZER });
    await expect(leaveGroup(created.group.id, "alice", deps)).rejects.toMatchObject(
      { code: DomainErrorCode.LAST_ORGANIZER },
    );
  });

  it("allows demote when another organizer exists", async () => {
    const deps = memoryDeps();
    const created = await createGroup(
      {
        actorId: "alice",
        name: "Club",
        sportDefault: "futbol",
        homeTimezone: "America/Bogota",
        description: null,
      },
      deps,
    );
    const invite = await createInvite(
      { groupId: created.group.id, actorId: "alice", maxUses: 5 },
      deps,
    );
    await acceptInvite(invite.code, "bob", deps);
    await changeMemberRole(
      {
        groupId: created.group.id,
        actorId: "alice",
        targetUserId: "bob",
        role: "organizer",
      },
      deps,
    );
    const demoted = await changeMemberRole(
      {
        groupId: created.group.id,
        actorId: "alice",
        targetUserId: "alice",
        role: "player",
      },
      deps,
    );
    expect(demoted.role).toBe("player");
  });

  it("forbids players from creating invites", async () => {
    const deps = memoryDeps();
    const created = await createGroup(
      {
        actorId: "alice",
        name: "Club",
        sportDefault: "futbol",
        homeTimezone: "America/Bogota",
        description: null,
      },
      deps,
    );
    const invite = await createInvite(
      { groupId: created.group.id, actorId: "alice" },
      deps,
    );
    await acceptInvite(invite.code, "bob", deps);
    await expect(
      createInvite({ groupId: created.group.id, actorId: "bob" }, deps),
    ).rejects.toMatchObject({ code: DomainErrorCode.FORBIDDEN });
  });

  it("unknown invite is NOT_FOUND", async () => {
    const deps = memoryDeps();
    await expect(previewInvite("nope", deps)).rejects.toMatchObject({
      code: DomainErrorCode.NOT_FOUND,
    });
  });
});
