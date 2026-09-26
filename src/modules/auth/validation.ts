import { z } from "zod";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { isValidIanaTimeZone } from "./domain/timezone";

export const registerBodySchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(320),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password is too long"),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(80, "Display name is too long"),
  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required")
    .refine(isValidIanaTimeZone, "Enter a valid IANA timezone"),
});

export const loginBodySchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(320),
  password: z.string().min(1, "Password is required").max(128),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;

export function validationErrorFromZod(error: z.ZodError): DomainError {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    if (!fields[key]) fields[key] = issue.message;
  }
  return new DomainError(
    DomainErrorCode.VALIDATION_ERROR,
    "Invalid request",
    { fields },
  );
}
