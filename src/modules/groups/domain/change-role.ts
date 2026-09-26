import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { assertNotLastOrganizer, requireOrganizer } from "./authz";
import { GROUP_NOT_FOUND_MESSAGE, MEMBER_NOT_FOUND_MESSAGE } from "./messages";
import type { GroupsDeps } from "./ports";
import type { MembershipRecord, MembershipRole } from "./types";

export type ChangeRoleInput = {
  groupId: string;
  actorId: string;
  targetUserId: string;
  role: MembershipRole;
};

export async function changeMemberRole(
  input: ChangeRoleInput,
  deps: GroupsDeps,
): Promise<MembershipRecord> {
  return deps.runInTransaction(async (tx) => {
    const group = await tx.groups.findById(input.groupId);
    if (!group) {
      throw new DomainError(DomainErrorCode.NOT_FOUND, GROUP_NOT_FOUND_MESSAGE);
    }

    requireOrganizer(await tx.memberships.find(input.groupId, input.actorId));

    const target = await tx.memberships.find(input.groupId, input.targetUserId);
    if (!target) {
      throw new DomainError(DomainErrorCode.NOT_FOUND, MEMBER_NOT_FOUND_MESSAGE);
    }

    if (target.role === input.role) {
      return target;
    }

    const organizerCount = await tx.memberships.lockGroupAndCountOrganizers(
      input.groupId,
    );
    if (target.role === "organizer" && input.role === "player") {
      assertNotLastOrganizer(target.role, organizerCount);
    }

    return tx.memberships.updateRole(
      input.groupId,
      input.targetUserId,
      input.role,
    );
  });
}
