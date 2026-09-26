import { z } from "zod";
import { isValidIanaTimeZone } from "@/modules/auth/domain/timezone";
import { SPORTS } from "./domain/types";
import { validationErrorFromZod } from "@/modules/auth/validation";

export { validationErrorFromZod };

export const createGroupBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long"),
  sportDefault: z.enum(SPORTS, {
    errorMap: () => ({ message: "Choose a valid sport" }),
  }),
  homeTimezone: z
    .string()
    .trim()
    .min(1, "Timezone is required")
    .refine(isValidIanaTimeZone, "Enter a valid IANA timezone"),
  description: z
    .string()
    .trim()
    .max(500, "Description is too long")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export const createInviteBodySchema = z.object({
  maxUses: z.number().int().min(1).max(50).optional(),
  email: z.string().trim().email().max(320).optional(),
});

export const changeRoleBodySchema = z.object({
  role: z.enum(["organizer", "player"], {
    errorMap: () => ({ message: "Role must be organizer or player" }),
  }),
});

export type CreateGroupBody = z.infer<typeof createGroupBodySchema>;
export type CreateInviteBody = z.infer<typeof createInviteBodySchema>;
export type ChangeRoleBody = z.infer<typeof changeRoleBodySchema>;
