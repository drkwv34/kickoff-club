import type { Sport } from "@/modules/groups/domain/types";

export const MATCH_STATUSES = ["scheduled", "cancelled"] as const;

export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const MIN_MATCH_CAPACITY = 1;
export const MAX_MATCH_CAPACITY = 200;

export type MatchRecord = {
  id: string;
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
  status: MatchStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicMatch = {
  id: string;
  groupId: string;
  seriesId: string | null;
  title: string;
  sport: Sport;
  venue: string;
  startAt: string;
  endAt: string;
  timezone: string;
  capacity: number;
  description: string | null;
  status: MatchStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export function toPublicMatch(match: MatchRecord): PublicMatch {
  return {
    id: match.id,
    groupId: match.groupId,
    seriesId: match.seriesId,
    title: match.title,
    sport: match.sport,
    venue: match.venue,
    startAt: match.startAt.toISOString(),
    endAt: match.endAt.toISOString(),
    timezone: match.timezone,
    capacity: match.capacity,
    description: match.description,
    status: match.status,
    createdBy: match.createdBy,
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString(),
  };
}
