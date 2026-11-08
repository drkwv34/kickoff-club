"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCsrfToken } from "./use-csrf-token";

type ApiErrorBody = {
  code?: string;
  message?: string;
  fields?: Record<string, string>;
};

export function ResetPasswordForm() {
  const csrf = useCsrfToken();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!csrf) return;
    setPending(true);
    setError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const payload = {
      token,
      password: String(form.get("password") ?? ""),
    };

    try {
      const res = await fetch("/api/v1/auth/password-reset/confirm", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
      if (!res.ok) {
        setFieldErrors(body.fields ?? {});
        setError(body.message ?? "Could not reset password");
        setPending(false);
        return;
      }
      window.location.assign("/app");
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(e) => void onSubmit(e)} noValidate>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <input type="hidden" name="token" value={token} />

      <div className="field">
        <label htmlFor="password">New password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          disabled={pending}
          aria-describedby={
            ["password-hint", fieldErrors.password && "password-error"]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-invalid={fieldErrors.password ? true : undefined}
        />
        <p id="password-hint" className="field-hint">
          At least 12 characters.
        </p>
        {fieldErrors.password ? (
          <p id="password-error" className="field-error" role="alert">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <button type="submit" className="btn" disabled={pending || !csrf}>
        {pending ? "Saving…" : "Set new password"}
      </button>

      <p className="form-switch">
        Need a new link? <Link href="/forgot-password">Forgot password</Link>
      </p>
    </form>
  );
}
