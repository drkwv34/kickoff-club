import type { GroupsDeps } from "./ports";
import { toPublicGroup, type MembershipRole, type PublicGroup } from "./types";

export type ListedMembership = {
  group: PublicGroup;
  role: MembershipRole;
  joinedAt: string;
};

export async function listGroupsForUser(
  userId: string,
  deps: GroupsDeps,
): Promise<ListedMembership[]> {
  const rows = await deps.memberships.listByUserId(userId);
  return rows.map(({ group, membership }) => ({
    group: toPublicGroup(group),
    role: membership.role,
    joinedAt: membership.joinedAt.toISOString(),
  }));
}
