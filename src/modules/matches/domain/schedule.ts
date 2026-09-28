import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { INVALID_SCHEDULE_MESSAGE } from "./messages";

export function assertEndAfterStart(startAt: Date, endAt: Date): void {
  if (endAt.getTime() <= startAt.getTime()) {
    throw new DomainError(
      DomainErrorCode.VALIDATION_ERROR,
      INVALID_SCHEDULE_MESSAGE,
      { fields: { endAt: INVALID_SCHEDULE_MESSAGE } },
    );
  }
}

export function parseInstant(value: string, field: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new DomainError(DomainErrorCode.VALIDATION_ERROR, "Invalid date/time", {
      fields: { [field]: "Enter a valid ISO-8601 date/time" },
    });
  }
  return parsed;
}
