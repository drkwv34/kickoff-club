import type { WeeklyRecurrenceRule } from "./recurrence";
import type { PublicMatch } from "./types";

export type { WeeklyRecurrenceRule };

export type SeriesRecord = {
  id: string;
  groupId: string;
  rruleJson: WeeklyRecurrenceRule;
  createdAt: Date;
};

export type PublicSeries = {
  id: string;
  groupId: string;
  rrule: WeeklyRecurrenceRule;
  createdAt: string;
};

export function toPublicSeries(series: SeriesRecord): PublicSeries {
  return {
    id: series.id,
    groupId: series.groupId,
    rrule: series.rruleJson,
    createdAt: series.createdAt.toISOString(),
  };
}

export type CreateSeriesResult = {
  series: PublicSeries;
  matches: PublicMatch[];
};
