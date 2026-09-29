import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { requireOrganizer } from "@/modules/groups/domain/authz";
import { loadGroupForActor } from "./access";
import { SERIES_NOT_FOUND_MESSAGE } from "./messages";
import type { MatchesDeps } from "./ports";
import { toPublicMatch, type PublicMatch } from "./types";

export type CancelSeriesResult = {
  seriesId: string;
  cancelledCount: number;
  matches: PublicMatch[];
};

export async function cancelMatchSeries(
  seriesId: string,
  actorId: string,
  deps: MatchesDeps,
): Promise<CancelSeriesResult> {
  const series = await deps.series.findById(seriesId);
  if (!series) {
    throw new DomainError(DomainErrorCode.NOT_FOUND, SERIES_NOT_FOUND_MESSAGE);
  }

  const { membership } = await loadGroupForActor(
    series.groupId,
    actorId,
    deps,
  );
  requireOrganizer(membership);

  const updated = await deps.matches.cancelScheduledBySeriesId(
    seriesId,
    deps.clock(),
  );

  return {
    seriesId,
    cancelledCount: updated.length,
    matches: updated.map(toPublicMatch),
  };
}
