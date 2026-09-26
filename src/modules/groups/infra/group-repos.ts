import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  groupInvites,
  groupMemberships,
  groups,
  users,
} from "@/lib/db/schema";
import { DomainError, DomainErrorCode, mapUnknownError } from "@/lib/errors/domain-error";
import type {
  GroupRepository,
  GroupStores,
  InviteRepository,
  MembershipRepository,
} from "../domain/ports";
import type {
  GroupRecord,
  InviteRecord,
  MemberListItem,
  MembershipRecord,
  Sport,
} from "../domain/types";

type Db = ReturnType<typeof getDb>;

function toGroup(row: typeof groups.$inferSelect): GroupRecord {
  return {
    id: row.id,
    name: row.name,
    sportDefault: row.sportDefault as Sport,
    homeTimezone: row.homeTimezone,
    description: row.description,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}

function toMembership(
  row: typeof groupMemberships.$inferSelect,
): MembershipRecord {
  return {
    groupId: row.groupId,
    userId: row.userId,
    role: row.role,
    noShowCount: row.noShowCount,
    joinedAt: row.joinedAt,
  };
}

function toInvite(row: typeof groupInvites.$inferSelect): InviteRecord {
  return {
    id: row.id,
    groupId: row.groupId,
    code: row.code,
    createdBy: row.createdBy,
    expiresAt: row.expiresAt,
    maxUses: row.maxUses,
    useCount: row.useCount,
    createdAt: row.createdAt,
  };
}

export function createGroupRepository(db: Db): GroupRepository {
  return {
    async create(input) {
      try {
        const [row] = await db
          .insert(groups)
          .values({
            name: input.name,
            sportDefault: input.sportDefault,
            homeTimezone: input.homeTimezone,
            description: input.description,
            createdBy: input.createdBy,
          })
          .returning();
        if (!row) throw new Error("insert groups returned no row");
        return toGroup(row);
      } catch (err) {
        throw mapUnknownError(err);
      }
    },
    async findById(id) {
      const [row] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
      return row ? toGroup(row) : null;
    },
  };
}

export function createMembershipRepository(db: Db): MembershipRepository {
  return {
    async create(input) {
      try {
        const [row] = await db
          .insert(groupMemberships)
          .values({
            groupId: input.groupId,
            userId: input.userId,
            role: input.role,
          })
          .returning();
        if (!row) throw new Error("insert group_memberships returned no row");
        return toMembership(row);
      } catch (err) {
        throw mapUnknownError(err);
      }
    },
    async find(groupId, userId) {
      const [row] = await db
        .select()
        .from(groupMemberships)
        .where(
          and(
            eq(groupMemberships.groupId, groupId),
            eq(groupMemberships.userId, userId),
          ),
        )
        .limit(1);
      return row ? toMembership(row) : null;
    },
    async listByUserId(userId) {
      const rows = await db
        .select({
          group: groups,
          membership: groupMemberships,
        })
        .from(groupMemberships)
        .innerJoin(groups, eq(groupMemberships.groupId, groups.id))
        .where(eq(groupMemberships.userId, userId));
      return rows.map((row) => ({
        group: toGroup(row.group),
        membership: toMembership(row.membership),
      }));
    },
    async listMembers(groupId) {
      const rows = await db
        .select({
          membership: groupMemberships,
          displayName: users.displayName,
        })
        .from(groupMemberships)
        .innerJoin(users, eq(groupMemberships.userId, users.id))
        .where(eq(groupMemberships.groupId, groupId));
      return rows.map((row): MemberListItem => ({
        ...toMembership(row.membership),
        displayName: row.displayName,
      }));
    },
    async lockGroupAndCountOrganizers(groupId) {
      const rows = await db
        .select()
        .from(groupMemberships)
        .where(eq(groupMemberships.groupId, groupId))
        .for("update");
      return rows.filter((row) => row.role === "organizer").length;
    },
    async updateRole(groupId, userId, role) {
      const [row] = await db
        .update(groupMemberships)
        .set({ role })
        .where(
          and(
            eq(groupMemberships.groupId, groupId),
            eq(groupMemberships.userId, userId),
          ),
        )
        .returning();
      if (!row) {
        throw new DomainError(DomainErrorCode.NOT_FOUND, "Member not found");
      }
      return toMembership(row);
    },
    async delete(groupId, userId) {
      await db
        .delete(groupMemberships)
        .where(
          and(
            eq(groupMemberships.groupId, groupId),
            eq(groupMemberships.userId, userId),
          ),
        );
    },
  };
}

export function createInviteRepository(db: Db): InviteRepository {
  return {
    async create(input) {
      try {
        const [row] = await db
          .insert(groupInvites)
          .values({
            groupId: input.groupId,
            code: input.code,
            createdBy: input.createdBy,
            expiresAt: input.expiresAt,
            maxUses: input.maxUses,
          })
          .returning();
        if (!row) throw new Error("insert group_invites returned no row");
        return toInvite(row);
      } catch (err) {
        throw mapUnknownError(err);
      }
    },
    async findByCode(code) {
      const [row] = await db
        .select()
        .from(groupInvites)
        .where(eq(groupInvites.code, code))
        .limit(1);
      return row ? toInvite(row) : null;
    },
    async findByCodeForUpdate(code) {
      const [row] = await db
        .select()
        .from(groupInvites)
        .where(eq(groupInvites.code, code))
        .for("update")
        .limit(1);
      return row ? toInvite(row) : null;
    },
    async incrementUseCount(id) {
      const [row] = await db
        .update(groupInvites)
        .set({ useCount: sql`${groupInvites.useCount} + 1` })
        .where(eq(groupInvites.id, id))
        .returning();
      if (!row) {
        throw new DomainError(DomainErrorCode.NOT_FOUND, "Invite not found");
      }
      return toInvite(row);
    },
  };
}

export function createGroupStores(db: Db): GroupStores {
  return {
    groups: createGroupRepository(db),
    memberships: createMembershipRepository(db),
    invites: createInviteRepository(db),
  };
}
