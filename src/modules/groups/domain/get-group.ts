import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { requireMember } from "./authz";
import { GROUP_NOT_FOUND_MESSAGE } from "./messages";
import type { GroupsDeps } from "./ports";
import {
  toPublicGroup,
  type MemberListItem,
  type MembershipRole,
  type PublicGroup,
} from "./types";

export type GroupDetail = {
  group: PublicGroup;
  role: MembershipRole;
  members: Array<{
    userId: string;
    displayName: string;
    role: MembershipRole;
    noShowCount: number;
    joinedAt: string;
  }>;
};

export async function getGroupDetail(
  groupId: string,
  actorId: string,
  deps: GroupsDeps,
): Promise<GroupDetail> {
  const group = await deps.groups.findById(groupId);
  if (!group) {
    throw new DomainError(DomainErrorCode.NOT_FOUND, GROUP_NOT_FOUND_MESSAGE);
  }

  const membership = requireMember(
    await deps.memberships.find(groupId, actorId),
  );
  const members: MemberListItem[] = await deps.memberships.listMembers(groupId);

  return {
    group: toPublicGroup(group),
    role: membership.role,
    members: members.map((member) => ({
      userId: member.userId,
      displayName: member.displayName,
      role: member.role,
      noShowCount: member.noShowCount,
      joinedAt: member.joinedAt.toISOString(),
    })),
  };
}
