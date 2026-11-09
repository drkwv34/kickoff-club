"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicMatch } from "@/modules/matches";
import { formatWallClock } from "@/modules/matches/domain/time-display";

type Props = {
  groupId: string;
  initialMatches: PublicMatch[];
  initialCursor: string | null;
  queryString: string;
};

export function MatchList({
  groupId,
  initialMatches,
  initialCursor,
  queryString,
}: Props) {
  const [matches, setMatches] = useState(initialMatches);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor || pending) return;
    setPending(true);
    setError(null);
    try {
      const params = new URLSearchParams(queryString);
      params.set("limit", "10");
      params.set("cursor", cursor);
      const res = await fetch(
        `/api/v1/groups/${groupId}/matches?${params.toString()}`,
        { credentials: "same-origin" },
      );
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        matches?: PublicMatch[];
        nextCursor?: string | null;
      };
      if (!res.ok) {
        setError(body.message ?? "Could not load more matches");
        return;
      }
      setMatches((current) => [...current, ...(body.matches ?? [])]);
      setCursor(body.nextCursor ?? null);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <ul className="match-list">
        {matches.map((match) => (
          <li key={match.id}>
            <Link href={`/app/matches/${match.id}`}>
              {match.title}
              {match.status === "cancelled" ? " (cancelled)" : ""}
            </Link>
            <span className="match-list-meta">
              {formatWallClock(match.startAt, match.timezone)}
            </span>
          </li>
        ))}
      </ul>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {cursor ? (
        <button
          type="button"
          className="btn btn-secondary"
          disabled={pending}
          onClick={() => void loadMore()}
        >
          {pending ? "Loading…" : "Load more matches"}
        </button>
      ) : null}
    </div>
  );
}
