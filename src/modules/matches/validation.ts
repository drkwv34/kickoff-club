import { z } from "zod";
import { isValidIanaTimeZone } from "@/modules/auth/domain/timezone";
import { SPORTS } from "@/modules/groups/domain/types";
import { validationErrorFromZod } from "@/modules/groups/validation";
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
    description: matchFields.description,
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
