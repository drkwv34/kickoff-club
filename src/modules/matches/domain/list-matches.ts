import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { loadGroupForActor } from "./access";
import {
  INVALID_DATE_RANGE_MESSAGE,
  INVALID_MATCH_CURSOR_MESSAGE,
} from "./messages";
import type { MatchListQuery, MatchListWhen, MatchesDeps } from "./ports";
import { toPublicMatch, type MatchStatus, type PublicMatch } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type MatchListFilters = {
  when?: MatchListWhen;
  status?: MatchStatus;
  from?: Date;
  to?: Date;
  cursor?: string;
  limit?: number;
};

type CursorPayload = { s: string; i: string };

function encodeCursor(startAt: Date, id: string): string {
  const payload: CursorPayload = { s: startAt.toISOString(), i: id };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(raw: string): { startAt: Date; id: string } {
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as CursorPayload;
    const startAt = new Date(parsed.s);
    if (Number.isNaN(startAt.getTime()) || !UUID_RE.test(parsed.i)) {
      throw new Error("invalid");
    }
    return { startAt, id: parsed.i };
  } catch {
    throw new DomainError(
      DomainErrorCode.VALIDATION_ERROR,
      INVALID_MATCH_CURSOR_MESSAGE,
      { fields: { cursor: INVALID_MATCH_CURSOR_MESSAGE } },
    );
  }
}

export async function listMatchesForGroup(
  groupId: string,
  actorId: string,
  deps: MatchesDeps,
  filters: MatchListFilters = {},
): Promise<{ matches: PublicMatch[]; nextCursor: string | null }> {
  await loadGroupForActor(groupId, actorId, deps);

  if (filters.from && filters.to && filters.from.getTime() > filters.to.getTime()) {
    throw new DomainError(
      DomainErrorCode.VALIDATION_ERROR,
      INVALID_DATE_RANGE_MESSAGE,
      { fields: { to: INVALID_DATE_RANGE_MESSAGE } },
    );
  }

  const query: MatchListQuery = {
    now: deps.clock(),
    when: filters.when,
    status: filters.status,
    from: filters.from,
    to: filters.to,
    after: filters.cursor ? decodeCursor(filters.cursor) : undefined,
    limit: filters.limit,
  };

  const rows = await deps.matches.listByGroupId(groupId, query);
  const hasMore = Boolean(filters.limit && rows.length > filters.limit);
  const page = hasMore && filters.limit ? rows.slice(0, filters.limit) : rows;
  const last = page[page.length - 1];
  return {
    matches: page.map(toPublicMatch),
    nextCursor:
      hasMore && last ? encodeCursor(last.startAt, last.id) : null,
  };
}
