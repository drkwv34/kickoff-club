import { describe, expect, it, vi } from "vitest";
import { DomainErrorCode } from "@/lib/errors/domain-error";
import { markNoShow } from "../mark-no-show";
import type { MatchesDeps } from "../ports";

const matchId = "match-1";
const groupId = "group-1";
const organizerId = "org-1";
const playerId = "player-1";

function buildDeps(overrides: Partial<MatchesDeps> = {}): MatchesDeps {
  const startAt = new Date("2020-01-01T12:00:00Z");
  const base: MatchesDeps = {
    matches: {
      findById: vi.fn(),
      findByIdForUpdate: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      listByGroupId: vi.fn(),
      listBySeriesId: vi.fn(),
      cancelScheduledBySeriesId: vi.fn(),
      update: vi.fn(),
    },
    series: {
      create: vi.fn(),
      findById: vi.fn(),
    },
    groups: {
      create: vi.fn(),
      findById: vi.fn(),
    },
    memberships: {
      create: vi.fn(),
      find: vi.fn(),
      listByUserId: vi.fn(),
      listMembers: vi.fn(),
      lockGroupAndCountOrganizers: vi.fn(),
      updateRole: vi.fn(),
      delete: vi.fn(),
      incrementNoShowCount: vi.fn(),
    },
    rsvps: {
      findByMatchAndUser: vi.fn(),
      countGoing: vi.fn(),
      nextWaitlistPosition: vi.fn(),
      save: vi.fn(),
      compactWaitlist: vi.fn(),
      promoteEarliestWaitlisted: vi.fn(),
      listUserIdsByMatchWithStatuses: vi.fn(),
    },
    noShows: {
      findByMatchAndUser: vi.fn(),
      create: vi.fn(),
    },
    clock: () => new Date("2020-01-02T12:00:00Z"),
    runInTransaction: async (work) => work({ matches: base.matches, series: base.series }),
  };
  base.matches.findById = vi.fn(async () => ({
    id: matchId,
    groupId,
    seriesId: null,
    title: "Test",
    sport: "futbol" as const,
    venue: "Park",
    startAt,
    endAt: new Date("2020-01-01T14:00:00Z"),
    timezone: "America/Bogota",
    capacity: 10,
    description: null,
    status: "scheduled" as const,
    createdBy: organizerId,
    createdAt: startAt,
    updatedAt: startAt,
  }));
  base.memberships.find = vi.fn(async () => ({
    groupId,
    userId: organizerId,
    role: "organizer" as const,
    noShowCount: 0,
    joinedAt: startAt,
  }));
  base.rsvps.findByMatchAndUser = vi.fn(async (_m, userId) =>
    userId === playerId
      ? {
          id: "rsvp-1",
          matchId,
          userId: playerId,
          status: "going" as const,
          waitlistPosition: null,
          createdAt: startAt,
          updatedAt: startAt,
        }
      : null,
  );
  base.noShows.findByMatchAndUser = vi.fn(async () => null);
  base.noShows.create = vi.fn(async (input) => ({
    id: "ns-1",
    ...input,
  }));
  base.memberships.incrementNoShowCount = vi.fn(async () => ({
    groupId,
    userId: playerId,
    role: "player" as const,
    noShowCount: 1,
    joinedAt: startAt,
  }));
  return { ...base, ...overrides };
}

describe("markNoShow", () => {
  it("rejects before match start", async () => {
    const deps = buildDeps({
      clock: () => new Date("2019-12-01T12:00:00Z"),
    });
    await expect(
      markNoShow(matchId, playerId, organizerId, deps),
    ).rejects.toMatchObject({
      code: DomainErrorCode.CONFLICT,
    });
  });

  it("rejects non-organizer", async () => {
    const deps = buildDeps();
    deps.memberships.find = vi.fn(async () => ({
      groupId,
      userId: playerId,
      role: "player" as const,
      noShowCount: 0,
      joinedAt: new Date(),
    }));
    await expect(
      markNoShow(matchId, playerId, playerId, deps),
    ).rejects.toMatchObject({
      code: DomainErrorCode.FORBIDDEN,
    });
  });

  it("marks no-show for going player after start", async () => {
    const deps = buildDeps();
    const result = await markNoShow(matchId, playerId, organizerId, deps);
    expect(result.noShowCount).toBe(1);
    expect(deps.noShows.create).toHaveBeenCalled();
    expect(deps.memberships.incrementNoShowCount).toHaveBeenCalledWith(
      groupId,
      playerId,
    );
  });
});
