"use client";

import { useState } from "react";
import { useCsrfToken } from "./use-csrf-token";

type Props = {
  matchId: string;
};

export function CancelMatchButton({ matchId }: Props) {
  const csrf = useCsrfToken();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCancel() {
    if (!csrf || pending) return;
    if (!window.confirm("Cancel this match for everyone?")) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/matches/${matchId}/cancel`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "x-csrf-token": csrf },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? "Could not cancel match");
        setPending(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  return (
    <div className="match-actions">
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="btn btn-danger"
        disabled={pending || !csrf}
        onClick={() => void onCancel()}
      >
        {pending ? "Cancelling…" : "Cancel match"}
      </button>
    </div>
  );
}
