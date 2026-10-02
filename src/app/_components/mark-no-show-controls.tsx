"use client";

import { useState } from "react";
import { useCsrfToken } from "./use-csrf-token";

type PlayerOption = {
  userId: string;
  displayName: string;
};

type Props = {
  matchId: string;
  players: PlayerOption[];
};

export function MarkNoShowControls({ matchId, players }: Props) {
  const csrf = useCsrfToken();
  const [userId, setUserId] = useState(players[0]?.userId ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (players.length === 0) {
    return null;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!csrf || !userId || pending) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/matches/${matchId}/no-shows`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({ userId }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        noShowCount?: number;
      };
      if (!res.ok) {
        setError(body.message ?? "Could not mark no-show");
        setPending(false);
        return;
      }
      setMessage(
        typeof body.noShowCount === "number"
          ? `No-show recorded (total: ${body.noShowCount})`
          : "No-show recorded",
      );
      setPending(false);
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  return (
    <section className="match-actions" aria-labelledby="no-show-heading">
      <h2 id="no-show-heading">Mark no-show</h2>
      <form onSubmit={(e) => void onSubmit(e)} className="stack-form">
        <label htmlFor="no-show-player">Player (going)</label>
        <select
          id="no-show-player"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          disabled={pending}
        >
          {players.map((player) => (
            <option key={player.userId} value={player.userId}>
              {player.displayName}
            </option>
          ))}
        </select>
        {error ? (
          <p className="form-error" role="alert">{error}</p>
        ) : null}
        {message ? <p className="form-success">{message}</p> : null}
        <button type="submit" className="btn btn-danger" disabled={pending || !csrf}>
          {pending ? "Saving…" : "Mark no-show"}
        </button>
      </form>
    </section>
  );
}
