import { getDb } from "@/lib/db/client";
import { createGroupStores } from "@/modules/groups/infra/group-repos";
import { createMatchRepository } from "@/modules/matches/infra/match-repos";
import type { RsvpStores, RsvpsDeps } from "./domain/ports";
import { createRsvpRepository } from "./infra/rsvp-repos";

let cached: RsvpsDeps | null = null;

function createRsvpStores(db: ReturnType<typeof getDb>): RsvpStores {
  return {
    matches: createMatchRepository(db),
    rsvps: createRsvpRepository(db),
  };
}

export function getRsvpsDeps(): RsvpsDeps {
  if (!cached) {
    const db = getDb();
    const groupStores = createGroupStores(db);
    const stores = createRsvpStores(db);
    cached = {
      ...stores,
      groups: groupStores.groups,
      memberships: groupStores.memberships,
      clock: () => new Date(),
      runInTransaction: async (work) => {
        return db.transaction(async (tx) => {
          const txStores = createRsvpStores(
            tx as unknown as ReturnType<typeof getDb>,
          );
          return work(txStores);
        });
      },
    };
  }
  return cached;
}

export function resetRsvpsDepsCache(): void {
  cached = null;
}
