"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { COMMON_TIMEZONES } from "@/modules/auth/domain/timezone";
import { safeNextPath } from "./safe-next-path";
import { useCsrfToken } from "./use-csrf-token";

type Mode = "register" | "login";

type ApiErrorBody = {
  code?: string;
  message?: string;
  fields?: Record<string, string>;
};

export function AuthForm({ mode }: { mode: Mode }) {
  const csrf = useCsrfToken();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const nextQuery =
    nextPath !== "/app" ? `?next=${encodeURIComponent(nextPath)}` : "";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isRegister = mode === "register";
  const endpoint = isRegister ? "/api/v1/auth/register" : "/api/v1/auth/login";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!csrf) return;
    setPending(true);
    setError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const payload: Record<string, string> = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    if (isRegister) {
      payload.displayName = String(form.get("displayName") ?? "");
      payload.timezone = String(form.get("timezone") ?? "");
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as ApiErrorBody & {
        user?: unknown;
      };
      if (!res.ok) {
        setFieldErrors(body.fields ?? {});
        setError(body.message ?? "Something went wrong");
        setPending(false);
        return;
      }
      window.location.assign(nextPath);
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

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
        />
        {fieldErrors.email ? (
          <p className="field-error">{fieldErrors.email}</p>
        ) : null}
      </div>

      {isRegister ? (
        <div className="field">
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="nickname"
            required
            maxLength={80}
            disabled={pending}
          />
          {fieldErrors.displayName ? (
            <p className="field-error">{fieldErrors.displayName}</p>
          ) : null}
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={isRegister ? 12 : undefined}
          disabled={pending}
        />
        {isRegister ? (
          <p className="field-hint">At least 12 characters.</p>
        ) : null}
        {fieldErrors.password ? (
          <p className="field-error">{fieldErrors.password}</p>
        ) : null}
      </div>

      {isRegister ? (
        <div className="field">
          <label htmlFor="timezone">Default timezone</label>
          <input
            id="timezone"
            name="timezone"
            type="text"
            list="timezone-options"
            defaultValue="America/Bogota"
            required
            disabled={pending}
          />
          <datalist id="timezone-options">
            {COMMON_TIMEZONES.map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
          {fieldErrors.timezone ? (
            <p className="field-error">{fieldErrors.timezone}</p>
          ) : null}
        </div>
      ) : null}

      <button type="submit" className="btn" disabled={pending || !csrf}>
        {pending
          ? isRegister
            ? "Creating account…"
            : "Signing in…"
          : isRegister
            ? "Create account"
            : "Sign in"}
      </button>

      <p className="form-switch">
        {isRegister ? (
          <>
            Already have an account? <Link href={`/login${nextQuery}`}>Sign in</Link>
          </>
        ) : (
          <>
            New here? <Link href={`/register${nextQuery}`}>Register</Link>
          </>
        )}
      </p>
    </form>
  );
}
