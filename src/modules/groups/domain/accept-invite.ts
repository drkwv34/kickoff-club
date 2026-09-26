import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import {
  ALREADY_MEMBER_MESSAGE,
  INVITE_EXPIRED_MESSAGE,
  INVITE_NOT_FOUND_MESSAGE,
} from "./messages";
import type { GroupsDeps } from "./ports";
import { toPublicGroup, type MembershipRole, type PublicGroup } from "./types";

export type AcceptInviteResult = {
  group: PublicGroup;
  role: MembershipRole;
};

export function inviteIsUsable(
  invite: { expiresAt: Date; maxUses: number; useCount: number },
  now: Date,
): boolean {
  return invite.expiresAt.getTime() > now.getTime() && invite.useCount < invite.maxUses;
}

export async function previewInvite(
  code: string,
  deps: GroupsDeps,
): Promise<{ group: PublicGroup; expiresAt: string }> {
  const invite = await deps.invites.findByCode(code);
  if (!invite) {
    throw new DomainError(DomainErrorCode.NOT_FOUND, INVITE_NOT_FOUND_MESSAGE);
  }
  if (!inviteIsUsable(invite, deps.clock())) {
    throw new DomainError(DomainErrorCode.GONE, INVITE_EXPIRED_MESSAGE);
  }
  const group = await deps.groups.findById(invite.groupId);
  if (!group) {
    throw new DomainError(DomainErrorCode.NOT_FOUND, INVITE_NOT_FOUND_MESSAGE);
  }
  return { group: toPublicGroup(group), expiresAt: invite.expiresAt.toISOString() };
}

export async function acceptInvite(
  code: string,
  actorId: string,
  deps: GroupsDeps,
): Promise<AcceptInviteResult> {
  return deps.runInTransaction(async (tx) => {
    const invite = await tx.invites.findByCodeForUpdate(code);
    if (!invite) {
      throw new DomainError(DomainErrorCode.NOT_FOUND, INVITE_NOT_FOUND_MESSAGE);
    }
    if (!inviteIsUsable(invite, deps.clock())) {
      throw new DomainError(DomainErrorCode.GONE, INVITE_EXPIRED_MESSAGE);
    }

    const existing = await tx.memberships.find(invite.groupId, actorId);
    if (existing) {
      throw new DomainError(DomainErrorCode.CONFLICT, ALREADY_MEMBER_MESSAGE);
    }

    const membership = await tx.memberships.create({
      groupId: invite.groupId,
      userId: actorId,
      role: "player",
    });
    await tx.invites.incrementUseCount(invite.id);

    const group = await tx.groups.findById(invite.groupId);
    if (!group) {
      throw new DomainError(DomainErrorCode.NOT_FOUND, INVITE_NOT_FOUND_MESSAGE);
    }

    return { group: toPublicGroup(group), role: membership.role };
  });
}
