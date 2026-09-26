import { getDb } from "@/lib/db/client";
import type { GroupsDeps, GroupStores } from "./domain/ports";
import { createGroupStores } from "./infra/group-repos";
import { randomInviteCode } from "./infra/invite-code";

let cached: GroupsDeps | null = null;

/** Composition root — api/ui may import this; domain must not. */
export function getGroupsDeps(): GroupsDeps {
  if (!cached) {
    const db = getDb();
    cached = {
      ...createGroupStores(db),
      clock: () => new Date(),
      randomCode: randomInviteCode,
      runInTransaction: async (work) => {
        return db.transaction(async (tx) => {
          const stores: GroupStores = createGroupStores(
            tx as unknown as ReturnType<typeof getDb>,
          );
          return work(stores);
        });
      },
    };
  }
  return cached;
}

export function resetGroupsDepsCache(): void {
  cached = null;
}
