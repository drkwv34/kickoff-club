"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCsrfToken } from "./use-csrf-token";

type ApiErrorBody = {
  code?: string;
  message?: string;
  fields?: Record<string, string>;
};

export function ForgotPasswordForm() {
  const csrf = useCsrfToken();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!csrf) return;
    setPending(true);
    setError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const payload = { email: String(form.get("email") ?? "") };

    try {
      const res = await fetch("/api/v1/auth/password-reset", {
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
        setError(body.message ?? "Could not send reset email");
        setPending(false);
        return;
      }
      setDone(true);
      setPending(false);
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className="lede" role="status">
        If that email is registered, we sent a reset link. Check your inbox.
      </p>
    );
  }

  return (
    <form className="auth-form" onSubmit={(e) => void onSubmit(e)} noValidate>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          aria-invalid={fieldErrors.email ? true : undefined}
        />
        {fieldErrors.email ? (
          <p id="email-error" className="field-error" role="alert">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <button type="submit" className="btn" disabled={pending || !csrf}>
        {pending ? "Sending…" : "Send reset link"}
      </button>

      <p className="form-switch">
        Remembered it? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
