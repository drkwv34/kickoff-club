import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import {
  LAST_ORGANIZER_MESSAGE,
  NOT_GROUP_MEMBER_MESSAGE,
  ORGANIZER_REQUIRED_MESSAGE,
} from "./messages";
import type { MembershipRecord, MembershipRole } from "./types";

export type GroupAction =
  | "view"
  | "invite"
  | "manage_roles"
  | "leave"
  | "create_group";

/**
 * Pure authz policy (no React/Next). Group roles are membership-scoped.
 * `create_group` is allowed for any authenticated caller (membership unused).
 */
export function canPerformGroupAction(input: {
  action: GroupAction;
  role: MembershipRole | null;
  organizerCount: number;
}): boolean {
  switch (input.action) {
    case "create_group":
      return true;
    case "view":
      return input.role !== null;
    case "invite":
    case "manage_roles":
      return input.role === "organizer";
    case "leave":
      if (input.role === null) return false;
      if (input.role === "organizer" && input.organizerCount <= 1) return false;
      return true;
    default: {
      const _exhaustive: never = input.action;
      return _exhaustive;
    }
  }
}

export function canDemoteOrganizer(organizerCount: number): boolean {
  return organizerCount > 1;
}

export function requireMember(
  membership: MembershipRecord | null,
): MembershipRecord {
  if (!membership) {
    throw new DomainError(DomainErrorCode.FORBIDDEN, NOT_GROUP_MEMBER_MESSAGE);
  }
  return membership;
}

export function requireOrganizer(
  membership: MembershipRecord | null,
): MembershipRecord {
  const member = requireMember(membership);
  if (member.role !== "organizer") {
    throw new DomainError(
      DomainErrorCode.FORBIDDEN,
      ORGANIZER_REQUIRED_MESSAGE,
    );
  }
  return member;
}

/** Throws LAST_ORGANIZER when removing organizer status would leave zero organizers. */
export function assertNotLastOrganizer(
  currentRole: MembershipRole,
  organizerCount: number,
): void {
  if (currentRole === "organizer" && organizerCount <= 1) {
    throw new DomainError(DomainErrorCode.LAST_ORGANIZER, LAST_ORGANIZER_MESSAGE);
  }
}
