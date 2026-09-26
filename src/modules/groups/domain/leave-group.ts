import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { assertNotLastOrganizer, requireMember } from "./authz";
import { GROUP_NOT_FOUND_MESSAGE } from "./messages";
import type { GroupsDeps } from "./ports";

export async function leaveGroup(
  groupId: string,
  actorId: string,
  deps: GroupsDeps,
): Promise<void> {
  await deps.runInTransaction(async (tx) => {
    const group = await tx.groups.findById(groupId);
    if (!group) {
      throw new DomainError(DomainErrorCode.NOT_FOUND, GROUP_NOT_FOUND_MESSAGE);
    }

    const membership = requireMember(
      await tx.memberships.find(groupId, actorId),
    );
    const organizerCount = await tx.memberships.lockGroupAndCountOrganizers(
      groupId,
    );
    assertNotLastOrganizer(membership.role, organizerCount);
    await tx.memberships.delete(groupId, actorId);
  });
}
