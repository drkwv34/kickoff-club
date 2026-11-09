import { z } from "zod";
import { isValidIanaTimeZone } from "@/modules/auth/domain/timezone";
import { SPORTS } from "@/modules/groups/domain/types";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { validationErrorFromZod } from "@/modules/groups/validation";
import {
  MAX_WEEKLY_INTERVAL,
  MIN_WEEKLY_INTERVAL,
  MAX_SERIES_COUNT,
  MIN_SERIES_COUNT,
  WEEKDAYS,
} from "./domain/recurrence";
import {
  MAX_MATCH_CAPACITY,
  MIN_MATCH_CAPACITY,
} from "./domain/types";

export { validationErrorFromZod };

const isoInstant = z
  .string()
  .trim()
  .min(1, "Start time is required")
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Enter a valid ISO-8601 date/time",
  });

const matchFields = {
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Title is too long"),
  sport: z.enum(SPORTS, {
    errorMap: () => ({ message: "Choose a valid sport" }),
  }),
  venue: z
    .string()
    .trim()
    .min(1, "Venue is required")
    .max(200, "Venue is too long"),
  startAt: isoInstant,
  endAt: isoInstant,
  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required")
    .refine(isValidIanaTimeZone, "Enter a valid IANA timezone"),
  capacity: z
    .number()
    .int()
    .min(MIN_MATCH_CAPACITY)
    .max(MAX_MATCH_CAPACITY),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
};

const updateDescription = z
  .string()
  .trim()
  .max(2000, "Description is too long")
  .nullish()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null || value.length === 0) return null;
    return value;
  });

export const createMatchBodySchema = z.object({
  ...matchFields,
  timezone: matchFields.timezone.optional(),
});

export const updateMatchBodySchema = z
  .object({
    title: matchFields.title.optional(),
    sport: matchFields.sport.optional(),
    venue: matchFields.venue.optional(),
    startAt: matchFields.startAt.optional(),
    endAt: matchFields.endAt.optional(),
    timezone: matchFields.timezone.optional(),
    capacity: matchFields.capacity.optional(),
    description: updateDescription,
  })
  .refine(
    (body) =>
      body.title !== undefined ||
      body.sport !== undefined ||
      body.venue !== undefined ||
      body.startAt !== undefined ||
      body.endAt !== undefined ||
      body.timezone !== undefined ||
      body.capacity !== undefined ||
      body.description !== undefined,
    { message: "Provide at least one field to update" },
  );

export type CreateMatchBody = z.infer<typeof createMatchBodySchema>;
export type UpdateMatchBody = z.infer<typeof updateMatchBodySchema>;

const localDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD for until date");

export const weeklyRecurrenceSchema = z
  .object({
    freq: z.literal("weekly"),
    interval: z
      .number()
      .int()
      .min(MIN_WEEKLY_INTERVAL)
      .max(MAX_WEEKLY_INTERVAL),
    byWeekday: z
      .array(z.enum(WEEKDAYS))
      .min(1, "Pick at least one weekday")
      .max(7),
    count: z.number().int().min(MIN_SERIES_COUNT).max(MAX_SERIES_COUNT).optional(),
    until: localDate.optional(),
  })
  .refine(
    (body) =>
      (body.count !== undefined && body.until === undefined) ||
      (body.count === undefined && body.until !== undefined),
    { message: "Provide either count or until, not both" },
  )
  .transform((body) => ({
    ...body,
    byWeekday: [...new Set(body.byWeekday)],
  }));

export const createSeriesBodySchema = z.object({
  ...matchFields,
  timezone: matchFields.timezone.optional(),
  recurrence: weeklyRecurrenceSchema,
});

export type CreateSeriesBody = z.infer<typeof createSeriesBodySchema>;

export const markNoShowBodySchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
});

export type MarkNoShowBody = z.infer<typeof markNoShowBodySchema>;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function parseQueryBound(value: string, endOfDay: boolean): Date {
  const normalized = DATE_ONLY.test(value)
    ? `${value}T${endOfDay ? "23:59:59.999Z" : "00:00:00.000Z"}`
    : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new DomainError(DomainErrorCode.VALIDATION_ERROR, "Invalid date/time", {
      fields: { [endOfDay ? "to" : "from"]: "Enter a valid ISO-8601 date/time" },
    });
  }
  return parsed;
}

export const matchListQuerySchema = z.object({
  when: z.enum(["upcoming", "past"]).optional(),
  status: z.enum(["scheduled", "cancelled"]).optional(),
  from: z.string().trim().min(1).optional(),
  to: z.string().trim().min(1).optional(),
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export function parseMatchListQuery(search: URLSearchParams): {
  when?: "upcoming" | "past";
  status?: "scheduled" | "cancelled";
  from?: Date;
  to?: Date;
  cursor?: string;
  limit?: number;
} {
  const blankToUndefined = (value: string | null) => {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : undefined;
  };
  const parsed = matchListQuerySchema.safeParse({
    when: blankToUndefined(search.get("when")),
    status: blankToUndefined(search.get("status")),
    from: blankToUndefined(search.get("from")),
    to: blankToUndefined(search.get("to")),
    cursor: blankToUndefined(search.get("cursor")),
    limit: blankToUndefined(search.get("limit")),
  });
  if (!parsed.success) {
    throw validationErrorFromZod(parsed.error);
  }
  return {
    when: parsed.data.when,
    status: parsed.data.status,
    from: parsed.data.from
      ? parseQueryBound(parsed.data.from, false)
      : undefined,
    to: parsed.data.to ? parseQueryBound(parsed.data.to, true) : undefined,
    cursor: parsed.data.cursor,
    limit: parsed.data.limit,
  };
}
