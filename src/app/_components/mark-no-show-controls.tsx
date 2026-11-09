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
  markedPlayers: PlayerOption[];
};

export function MarkNoShowControls({
  matchId,
  players,
  markedPlayers,
}: Props) {
  const csrf = useCsrfToken();
  const [userId, setUserId] = useState(players[0]?.userId ?? "");
  const [pending, setPending] = useState(false);
  const [unmarkingId, setUnmarkingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (players.length === 0 && markedPlayers.length === 0) {
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

  async function onUnmark(targetUserId: string) {
    if (!csrf || unmarkingId || pending) return;
    setUnmarkingId(targetUserId);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/v1/matches/${matchId}/no-shows/${targetUserId}`,
        {
          method: "DELETE",
          credentials: "same-origin",
          headers: {
            "x-csrf-token": csrf,
          },
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? "Could not unmark no-show");
        setUnmarkingId(null);
        return;
      }
      window.location.reload();
    } catch {
      setError("Network error. Try again.");
      setUnmarkingId(null);
    }
  }

  return (
    <section className="match-actions" aria-labelledby="no-show-heading">
      <h2 id="no-show-heading">Mark no-show</h2>
      {players.length > 0 ? (
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
      ) : null}
      {markedPlayers.length > 0 ? (
        <div className="unmark-no-shows">
          <h3 id="unmark-no-show-heading">Marked no-shows</h3>
          {players.length === 0 && error ? (
            <p className="form-error" role="alert">{error}</p>
          ) : null}
          <ul className="unmark-no-show-list">
            {markedPlayers.map((player) => (
              <li key={player.userId}>
                <span>{player.displayName}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={!csrf || unmarkingId === player.userId}
                  onClick={() => void onUnmark(player.userId)}
                >
                  {unmarkingId === player.userId ? "Unmarking…" : "Unmark no-show"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
