import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { requireOrganizer } from "./authz";
import { GROUP_NOT_FOUND_MESSAGE } from "./messages";
import type { GroupsDeps } from "./ports";
import {
  DEFAULT_INVITE_MAX_USES,
  DEFAULT_INVITE_TTL_MS,
  MAX_INVITE_MAX_USES,
  MIN_INVITE_MAX_USES,
  type InviteRecord,
} from "./types";

export type CreateInviteInput = {
  groupId: string;
  actorId: string;
  maxUses?: number;
};

export type PublicInvite = {
  code: string;
  groupId: string;
  expiresAt: string;
  maxUses: number;
  useCount: number;
  acceptPath: string;
};

export function toPublicInvite(invite: InviteRecord): PublicInvite {
  return {
    code: invite.code,
    groupId: invite.groupId,
    expiresAt: invite.expiresAt.toISOString(),
    maxUses: invite.maxUses,
    useCount: invite.useCount,
    acceptPath: `/invite/${invite.code}`,
  };
}

export function normalizeMaxUses(maxUses: number | undefined): number {
  const value = maxUses ?? DEFAULT_INVITE_MAX_USES;
  if (
    !Number.isInteger(value) ||
    value < MIN_INVITE_MAX_USES ||
    value > MAX_INVITE_MAX_USES
  ) {
    throw new DomainError(DomainErrorCode.VALIDATION_ERROR, "Invalid request", {
      fields: {
        maxUses: `maxUses must be an integer from ${MIN_INVITE_MAX_USES} to ${MAX_INVITE_MAX_USES}`,
      },
    });
  }
  return value;
}

export async function createInvite(
  input: CreateInviteInput,
  deps: GroupsDeps,
): Promise<PublicInvite> {
  const group = await deps.groups.findById(input.groupId);
  if (!group) {
    throw new DomainError(DomainErrorCode.NOT_FOUND, GROUP_NOT_FOUND_MESSAGE);
  }
  requireOrganizer(await deps.memberships.find(input.groupId, input.actorId));

  const now = deps.clock();
  const invite = await deps.invites.create({
    groupId: input.groupId,
    code: deps.randomCode(),
    createdBy: input.actorId,
    expiresAt: new Date(now.getTime() + DEFAULT_INVITE_TTL_MS),
    maxUses: normalizeMaxUses(input.maxUses),
  });
  return toPublicInvite(invite);
}
