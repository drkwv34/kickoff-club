import type {
  GroupRecord,
  InviteRecord,
  MemberListItem,
  MembershipRecord,
  MembershipRole,
  Sport,
} from "./types";

export type GroupRepository = {
  create(input: {
    name: string;
    sportDefault: Sport;
    homeTimezone: string;
    description: string | null;
    createdBy: string;
  }): Promise<GroupRecord>;
  findById(id: string): Promise<GroupRecord | null>;
};

export type MembershipRepository = {
  create(input: {
    groupId: string;
    userId: string;
    role: MembershipRole;
  }): Promise<MembershipRecord>;
  find(groupId: string, userId: string): Promise<MembershipRecord | null>;
  listByUserId(
    userId: string,
  ): Promise<Array<{ group: GroupRecord; membership: MembershipRecord }>>;
  listMembers(groupId: string): Promise<MemberListItem[]>;
  /** Locks membership rows for the group (FOR UPDATE) then counts organizers. */
  lockGroupAndCountOrganizers(groupId: string): Promise<number>;
  updateRole(
    groupId: string,
    userId: string,
    role: MembershipRole,
  ): Promise<MembershipRecord>;
  delete(groupId: string, userId: string): Promise<void>;
};

export type InviteRepository = {
  create(input: {
    groupId: string;
    code: string;
    createdBy: string;
    expiresAt: Date;
    maxUses: number;
  }): Promise<InviteRecord>;
  findByCode(code: string): Promise<InviteRecord | null>;
  findByCodeForUpdate(code: string): Promise<InviteRecord | null>;
  incrementUseCount(id: string): Promise<InviteRecord>;
};

export type GroupStores = {
  groups: GroupRepository;
  memberships: MembershipRepository;
  invites: InviteRepository;
};

export type GroupsDeps = GroupStores & {
  clock: () => Date;
  randomCode: () => string;
  runInTransaction: <T>(work: (stores: GroupStores) => Promise<T>) => Promise<T>;
};
