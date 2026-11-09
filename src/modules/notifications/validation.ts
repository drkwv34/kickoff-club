import { z } from "zod";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { NOTIFICATION_TYPES } from "./domain/types";

export const markNotificationsReadBodySchema = z
  .object({
    ids: z.array(z.string().uuid()).optional(),
    all: z.boolean().optional(),
  })
  .refine((v) => v.all === true || (v.ids && v.ids.length > 0), {
    message: "Provide notification ids or all: true",
  });

export const updateNotificationPreferencesBodySchema = z.object({
  preferences: z
    .array(
      z
        .object({
          type: z.enum(NOTIFICATION_TYPES),
          inApp: z.boolean().optional(),
          email: z.boolean().optional(),
        })
        .refine(
          (row) => row.inApp !== undefined || row.email !== undefined,
          { message: "Provide inApp and/or email" },
        ),
    )
    .min(1, "Provide at least one preference"),
});

export type UpdateNotificationPreferencesBody = z.infer<
  typeof updateNotificationPreferencesBodySchema
>;

export function validationErrorFromZod(error: z.ZodError): DomainError {
  return new DomainError(DomainErrorCode.VALIDATION_ERROR, "Invalid request body", {
    fields: error.flatten().fieldErrors,
  });
}
