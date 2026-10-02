import type {
  GroupRepository,
  MembershipRepository,
} from "@/modules/groups/domain/ports";
import type { MatchRecord } from "@/modules/matches/domain/types";
import type { MatchRepository } from "@/modules/matches/domain/ports";
import type { RsvpRecord, RsvpStatus } from "./types";

export type RsvpWriteInput = {
  matchId: string;
  userId: string;
  status: RsvpStatus;
  waitlistPosition: number | null;
  updatedAt: Date;
};

export type RsvpRepository = {
  findByMatchAndUser(matchId: string, userId: string): Promise<RsvpRecord | null>;
  countGoing(matchId: string): Promise<number>;
  nextWaitlistPosition(matchId: string): Promise<number>;
  save(input: RsvpWriteInput & { id?: string; createdAt?: Date }): Promise<RsvpRecord>;
  compactWaitlist(matchId: string): Promise<void>;
  /** FIFO head of waitlist → going; null if empty. */
  promoteEarliestWaitlisted(
    matchId: string,
    updatedAt: Date,
  ): Promise<RsvpRecord | null>;
  listUserIdsByMatchWithStatuses(
    matchId: string,
    statuses: RsvpStatus[],
  ): Promise<string[]>;
};

export type RsvpStores = {
  matches: MatchRepository;
  rsvps: RsvpRepository;
};

export type RsvpsDeps = RsvpStores & {
  groups: GroupRepository;
  memberships: MembershipRepository;
  clock: () => Date;
  runInTransaction: <T>(work: (stores: RsvpStores) => Promise<T>) => Promise<T>;
};

export type LockedMatch = MatchRecord;
