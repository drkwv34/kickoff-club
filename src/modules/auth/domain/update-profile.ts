import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { AUTH_REQUIRED_MESSAGE } from "./messages";
import type { AuthDeps } from "./ports";
import { isValidIanaTimeZone } from "./timezone";
import { toPublicUser, type PublicUser } from "./user";

export type UpdateProfileInput = {
  userId: string;
  displayName?: string;
  timezone?: string;
};

export async function updateProfile(
  input: UpdateProfileInput,
  deps: AuthDeps,
): Promise<PublicUser> {
  if (input.displayName === undefined && input.timezone === undefined) {
    throw new DomainError(DomainErrorCode.VALIDATION_ERROR, "Invalid request", {
      fields: { _root: "Provide displayName or timezone" },
    });
  }
  if (input.timezone !== undefined && !isValidIanaTimeZone(input.timezone)) {
    throw new DomainError(DomainErrorCode.VALIDATION_ERROR, "Invalid request", {
      fields: { timezone: "Enter a valid IANA timezone" },
    });
  }

  const existing = await deps.users.findById(input.userId);
  if (!existing) {
    throw new DomainError(DomainErrorCode.UNAUTHENTICATED, AUTH_REQUIRED_MESSAGE);
  }

  const updated = await deps.users.update(input.userId, {
    ...(input.displayName !== undefined
      ? { displayName: input.displayName }
      : {}),
    ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
  });
  return toPublicUser(updated);
}
