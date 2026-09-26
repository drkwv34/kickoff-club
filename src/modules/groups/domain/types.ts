export const SPORTS = [
  "futbol",
  "basketball",
  "volleyball",
  "tennis",
  "other",
] as const;

export type Sport = (typeof SPORTS)[number];

export const MEMBERSHIP_ROLES = ["organizer", "player"] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export type GroupRecord = {
  id: string;
  name: string;
  sportDefault: Sport;
  homeTimezone: string;
  description: string | null;
  createdBy: string;
  createdAt: Date;
};

export type MembershipRecord = {
  groupId: string;
  userId: string;
  role: MembershipRole;
  noShowCount: number;
  joinedAt: Date;
};

export type MemberListItem = MembershipRecord & {
  displayName: string;
};

export type InviteRecord = {
  id: string;
  groupId: string;
  code: string;
  createdBy: string;
  expiresAt: Date;
  maxUses: number;
  useCount: number;
  createdAt: Date;
};

export type PublicGroup = {
  id: string;
  name: string;
  sportDefault: Sport;
  homeTimezone: string;
  description: string | null;
  createdAt: string;
};

export function toPublicGroup(group: GroupRecord): PublicGroup {
  return {
    id: group.id,
    name: group.name,
    sportDefault: group.sportDefault,
    homeTimezone: group.homeTimezone,
    description: group.description,
    createdAt: group.createdAt.toISOString(),
  };
}

export const DEFAULT_INVITE_MAX_USES = 50;
export const MIN_INVITE_MAX_USES = 1;
export const MAX_INVITE_MAX_USES = 50;
export const DEFAULT_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
