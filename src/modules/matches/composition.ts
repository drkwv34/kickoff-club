import { getDb } from "@/lib/db/client";
import { createGroupStores } from "@/modules/groups/infra/group-repos";
import type { MatchesDeps, MatchStores } from "./domain/ports";
import { createMatchRepository } from "./infra/match-repos";
import { createSeriesRepository } from "./infra/series-repos";

let cached: MatchesDeps | null = null;

function createMatchStores(db: ReturnType<typeof getDb>): MatchStores {
  return {
    matches: createMatchRepository(db),
    series: createSeriesRepository(db),
  };
}

export function getMatchesDeps(): MatchesDeps {
  if (!cached) {
    const db = getDb();
    const stores = createGroupStores(db);
    const matchStores = createMatchStores(db);
    cached = {
      ...matchStores,
      groups: stores.groups,
      memberships: stores.memberships,
      clock: () => new Date(),
      runInTransaction: async (work) => {
        return db.transaction(async (tx) => {
          const txStores = createMatchStores(
            tx as unknown as ReturnType<typeof getDb>,
          );
          return work(txStores);
        });
      },
    };
  }
  return cached;
}

export function resetMatchesDepsCache(): void {
  cached = null;
}
