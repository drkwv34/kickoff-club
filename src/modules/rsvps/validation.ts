import { z } from "zod";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";

export const setRsvpBodySchema = z.object({
  status: z.enum(["going", "declined"]),
});

export function validationErrorFromZod(
  error: z.ZodError,
): DomainError {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] = issue.message;
  }
  return new DomainError(
    DomainErrorCode.VALIDATION_ERROR,
    "Validation failed",
    { fields },
  );
}
