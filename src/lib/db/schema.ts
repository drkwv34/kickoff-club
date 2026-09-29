import {
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/** Case-insensitive email (FR-AUTH-001). Requires CREATE EXTENSION citext. */
const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

/** SRS Appendix A — sport enum. */
export const sportEnum = pgEnum("sport", [
  "futbol",
  "basketball",
  "volleyball",
  "tennis",
  "other",
]);

/** SRS Appendix A — membership roles (group-scoped). */
export const membershipRoleEnum = pgEnum("membership_role", [
  "organizer",
  "player",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: citext("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    timezone: text("timezone").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    sportDefault: sportEnum("sport_default").notNull(),
    homeTimezone: text("home_timezone").notNull(),
    description: text("description"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("groups_created_by_idx").on(table.createdBy)],
);

export const groupMemberships = pgTable(
  "group_memberships",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull(),
    noShowCount: integer("no_show_count").notNull().default(0),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "group_memberships_pk",
      columns: [table.groupId, table.userId],
    }),
    index("group_memberships_user_id_idx").on(table.userId),
  ],
);

export const groupInvites = pgTable(
  "group_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    maxUses: integer("max_uses").notNull(),
    useCount: integer("use_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("group_invites_code_unique").on(table.code),
    index("group_invites_group_id_idx").on(table.groupId),
    index("group_invites_expires_at_idx").on(table.expiresAt),
  ],
);

/** SRS §6 — match lifecycle. */
export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "cancelled",
]);

export const matchSeries = pgTable(
  "match_series",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    rruleJson: jsonb("rrule_json").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("match_series_group_id_idx").on(table.groupId)],
);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    seriesId: uuid("series_id").references(() => matchSeries.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    sport: sportEnum("sport").notNull(),
    venue: text("venue").notNull(),
    startAt: timestamp("start_at", { withTimezone: true, mode: "date" }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true, mode: "date" }).notNull(),
    timezone: text("timezone").notNull(),
    capacity: integer("capacity").notNull(),
    description: text("description"),
    status: matchStatusEnum("status").notNull().default("scheduled"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("matches_group_id_start_at_idx").on(table.groupId, table.startAt),
    index("matches_status_start_at_idx").on(table.status, table.startAt),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  memberships: many(groupMemberships),
  createdGroups: many(groups),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, { fields: [groups.createdBy], references: [users.id] }),
  memberships: many(groupMemberships),
  invites: many(groupInvites),
  matches: many(matches),
  series: many(matchSeries),
}));

export const groupMembershipsRelations = relations(
  groupMemberships,
  ({ one }) => ({
    group: one(groups, {
      fields: [groupMemberships.groupId],
      references: [groups.id],
    }),
    user: one(users, {
      fields: [groupMemberships.userId],
      references: [users.id],
    }),
  }),
);

export const groupInvitesRelations = relations(groupInvites, ({ one }) => ({
  group: one(groups, {
    fields: [groupInvites.groupId],
    references: [groups.id],
  }),
  creator: one(users, {
    fields: [groupInvites.createdBy],
    references: [users.id],
  }),
}));

export const matchSeriesRelations = relations(matchSeries, ({ one, many }) => ({
  group: one(groups, {
    fields: [matchSeries.groupId],
    references: [groups.id],
  }),
  matches: many(matches),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  group: one(groups, {
    fields: [matches.groupId],
    references: [groups.id],
  }),
  series: one(matchSeries, {
    fields: [matches.seriesId],
    references: [matchSeries.id],
  }),
  creator: one(users, {
    fields: [matches.createdBy],
    references: [users.id],
  }),
}));

/** Table names CI/verify scripts assert after migrate. */
export const CORE_TABLES = [
  "users",
  "sessions",
  "groups",
  "group_memberships",
  "group_invites",
  "match_series",
  "matches",
] as const;
