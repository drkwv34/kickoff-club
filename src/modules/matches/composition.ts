import { getDb } from "@/lib/db/client";
import { createGroupStores } from "@/modules/groups/infra/group-repos";
import type { MatchesDeps } from "./domain/ports";
import { createMatchRepository } from "./infra/match-repos";

let cached: MatchesDeps | null = null;

export function getMatchesDeps(): MatchesDeps {
  if (!cached) {
    const db = getDb();
    const stores = createGroupStores(db);
    cached = {
      matches: createMatchRepository(db),
      groups: stores.groups,
      memberships: stores.memberships,
      clock: () => new Date(),
    };
  }
  return cached;
}

export function resetMatchesDepsCache(): void {
  cached = null;
}
