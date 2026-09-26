import { requireOrganizer } from "./authz";
import type { GroupsDeps } from "./ports";
import { toPublicGroup, type PublicGroup, type Sport } from "./types";

export type CreateGroupInput = {
  actorId: string;
  name: string;
  sportDefault: Sport;
  homeTimezone: string;
  description: string | null;
};

export type CreateGroupResult = {
  group: PublicGroup;
  role: "organizer";
};

export async function createGroup(
  input: CreateGroupInput,
  deps: GroupsDeps,
): Promise<CreateGroupResult> {
  return deps.runInTransaction(async (tx) => {
    const group = await tx.groups.create({
      name: input.name,
      sportDefault: input.sportDefault,
      homeTimezone: input.homeTimezone,
      description: input.description,
      createdBy: input.actorId,
    });
    const membership = await tx.memberships.create({
      groupId: group.id,
      userId: input.actorId,
      role: "organizer",
    });
    requireOrganizer(membership);
    return { group: toPublicGroup(group), role: "organizer" };
  });
}
