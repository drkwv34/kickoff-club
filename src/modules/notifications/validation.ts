import { z } from "zod";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";

export const markNotificationsReadBodySchema = z
  .object({
    ids: z.array(z.string().uuid()).optional(),
    all: z.boolean().optional(),
  })
  .refine((v) => v.all === true || (v.ids && v.ids.length > 0), {
    message: "Provide notification ids or all: true",
  });

export function validationErrorFromZod(error: z.ZodError): DomainError {
  return new DomainError(DomainErrorCode.VALIDATION_ERROR, "Invalid request body", {
    fields: error.flatten().fieldErrors,
  });
}
