"use client";

import { useState } from "react";
import { useCsrfToken } from "./use-csrf-token";

export function LogoutButton() {
  const csrf = useCsrfToken();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogout() {
    if (!csrf) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "x-csrf-token": csrf },
      });
      if (!res.ok && res.status !== 204) {
        setError("Could not sign out. Try again.");
        setPending(false);
        return;
      }
      window.location.assign("/");
    } catch {
      setError("Could not sign out. Try again.");
      setPending(false);
    }
  }

  return (
    <span className="logout-wrap">
      <button
        type="button"
        className="btn btn-quiet"
        onClick={() => void onLogout()}
        disabled={!csrf || pending}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error ? (
        <span className="form-error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
