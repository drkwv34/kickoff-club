import type { GroupRepository, MembershipRepository } from "@/modules/groups/domain/ports";
import type { Sport } from "@/modules/groups/domain/types";
import type { RsvpRepository } from "@/modules/rsvps/domain/ports";
import type { SeriesRecord, WeeklyRecurrenceRule } from "./series-types";
import type { MatchRecord, MatchStatus } from "./types";

export type SeriesRepository = {
  create(input: {
    groupId: string;
    rruleJson: WeeklyRecurrenceRule;
  }): Promise<SeriesRecord>;
  findById(id: string): Promise<SeriesRecord | null>;
};

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
  createMany(
    inputs: Array<{
      groupId: string;
      seriesId: string;
      title: string;
      sport: Sport;
      venue: string;
      startAt: Date;
      endAt: Date;
      timezone: string;
      capacity: number;
      description: string | null;
      createdBy: string;
    }>,
  ): Promise<MatchRecord[]>;
  findById(id: string): Promise<MatchRecord | null>;
  findByIdForUpdate(id: string): Promise<MatchRecord | null>;
  listByGroupId(groupId: string): Promise<MatchRecord[]>;
  listBySeriesId(seriesId: string): Promise<MatchRecord[]>;
  cancelScheduledBySeriesId(seriesId: string, updatedAt: Date): Promise<MatchRecord[]>;
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

export type MatchStores = {
  matches: MatchRepository;
  series: SeriesRepository;
};

export type NoShowRecord = {
  id: string;
  matchId: string;
  userId: string;
  markedBy: string;
  markedAt: Date;
};

export type NoShowRepository = {
  findByMatchAndUser(
    matchId: string,
    userId: string,
  ): Promise<NoShowRecord | null>;
  create(input: {
    matchId: string;
    userId: string;
    markedBy: string;
    markedAt: Date;
  }): Promise<NoShowRecord>;
};

export type MatchesDeps = {
  matches: MatchRepository;
  series: SeriesRepository;
  groups: GroupRepository;
  memberships: MembershipRepository;
  rsvps: RsvpRepository;
  noShows: NoShowRepository;
  clock: () => Date;
  runInTransaction: <T>(work: (stores: MatchStores) => Promise<T>) => Promise<T>;
};
