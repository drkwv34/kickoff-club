import type { GroupRepository, MembershipRepository } from "@/modules/groups/domain/ports";
import type { Sport } from "@/modules/groups/domain/types";
import type { MatchRecord, MatchStatus } from "./types";

export type MatchRepository = {
  create(input: {
    groupId: string;
    seriesId: string | null;
    title: string;
    sport: Sport;
    venue: string;
    startAt: Date;
    endAt: Date;
    timezone: string;
    capacity: number;
    description: string | null;
    createdBy: string;
  }): Promise<MatchRecord>;
  findById(id: string): Promise<MatchRecord | null>;
  listByGroupId(groupId: string): Promise<MatchRecord[]>;
  update(
    id: string,
    patch: {
      title?: string;
      sport?: Sport;
      venue?: string;
      startAt?: Date;
      endAt?: Date;
      timezone?: string;
      capacity?: number;
      description?: string | null;
      status?: MatchStatus;
      updatedAt: Date;
    },
  ): Promise<MatchRecord>;
};

export type MatchesDeps = {
  matches: MatchRepository;
  groups: GroupRepository;
  memberships: MembershipRepository;
  clock: () => Date;
};
