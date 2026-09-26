import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { INVALID_CREDENTIALS_MESSAGE } from "./messages";
import type { AuthDeps } from "./ports";
import { issueSession, type AuthResult } from "./register";

export type LoginInput = {
  email: string;
  password: string;
};

export async function loginUser(
  input: LoginInput,
  deps: AuthDeps,
): Promise<AuthResult> {
  const email = input.email.trim();
  const user = await deps.users.findByEmail(email);
  const hashToCheck = user
    ? user.passwordHash
    : await deps.passwords.dummyHash();

  let matches = false;
  try {
    matches = await deps.passwords.verify(hashToCheck, input.password);
  } catch {
    matches = false;
  }

  if (!user || !matches) {
    throw new DomainError(
      DomainErrorCode.INVALID_CREDENTIALS,
      INVALID_CREDENTIALS_MESSAGE,
    );
  }

  return issueSession(user, deps);
}
