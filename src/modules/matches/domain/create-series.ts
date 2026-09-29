import { requireOrganizer } from "@/modules/groups/domain/authz";
import type { Sport } from "@/modules/groups/domain/types";
import { assertEndAfterStart } from "./schedule";
import { loadGroupForActor } from "./access";
import type { MatchesDeps } from "./ports";
import {
  expandWeeklyRecurrence,
  type WeeklyRecurrenceRule,
} from "./recurrence";
import { toPublicSeries, type CreateSeriesResult } from "./series-types";
import { toPublicMatch } from "./types";

export type CreateSeriesInput = {
  actorId: string;
  groupId: string;
  title: string;
  sport: Sport;
  venue: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  capacity: number;
  description: string | null;
  recurrence: WeeklyRecurrenceRule;
};

export async function createMatchSeries(
  input: CreateSeriesInput,
  deps: MatchesDeps,
): Promise<CreateSeriesResult> {
  const { group, membership } = await loadGroupForActor(
    input.groupId,
    input.actorId,
    deps,
  );
  requireOrganizer(membership);
  assertEndAfterStart(input.startAt, input.endAt);

  const occurrences = expandWeeklyRecurrence(
    input.startAt,
    input.endAt,
    input.timezone,
    input.recurrence,
  );

  const rruleJson = input.recurrence;

  return deps.runInTransaction(async (stores) => {
    const series = await stores.series.create({
      groupId: group.id,
      rruleJson,
    });

    const created = await stores.matches.createMany(
      occurrences.map((occurrence) => ({
        groupId: group.id,
        seriesId: series.id,
        title: input.title,
        sport: input.sport,
        venue: input.venue,
        startAt: occurrence.startAt,
        endAt: occurrence.endAt,
        timezone: input.timezone,
        capacity: input.capacity,
        description: input.description,
        createdBy: input.actorId,
      })),
    );

    return {
      series: toPublicSeries(series),
      matches: created.map(toPublicMatch),
    };
  });
}
