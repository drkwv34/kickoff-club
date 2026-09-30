"use client";

import { useState } from "react";
import { useCsrfToken } from "./use-csrf-token";
import type { PublicRsvp, RsvpStatus } from "@/modules/rsvps";

type Props = {
  matchId: string;
  capacity: number;
  goingCount: number;
  viewerRsvp: PublicRsvp | null;
  matchOpen: boolean;
};

function statusLabel(status: RsvpStatus): string {
  switch (status) {
    case "going":
      return "You are going";
    case "waitlisted":
      return "You are on the waitlist";
    case "declined":
      return "You declined";
    case "cancelled":
      return "You cancelled your RSVP";
    default:
      return status;
  }
}

export function RsvpControls({
  matchId,
  capacity,
  goingCount,
  viewerRsvp,
  matchOpen,
}: Props) {
  const csrf = useCsrfToken();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function postStatus(status: "going" | "declined") {
    if (!csrf || pending || !matchOpen) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/matches/${matchId}/rsvps`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        setError(body.message ?? "Could not update RSVP");
        setPending(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  async function onCancelRsvp() {
    if (!csrf || pending || !matchOpen) return;
    if (!window.confirm("Cancel your RSVP for this match?")) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/matches/${matchId}/rsvps/me`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "x-csrf-token": csrf },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        setError(body.message ?? "Could not cancel RSVP");
        setPending(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  const activeStatus =
    viewerRsvp &&
    viewerRsvp.status !== "cancelled" &&
    viewerRsvp.status !== "declined"
      ? viewerRsvp.status
      : null;

  return (
    <section className="rsvp-panel" aria-labelledby="rsvp-heading">
      <h2 id="rsvp-heading">Your RSVP</h2>
      <p className="rsvp-capacity">
        {goingCount} / {capacity} spots filled
      </p>
      {viewerRsvp && viewerRsvp.status !== "cancelled" ? (
        <p className="rsvp-status">
          {statusLabel(viewerRsvp.status)}
          {viewerRsvp.status === "waitlisted" &&
          viewerRsvp.waitlistPosition != null
            ? ` (position ${viewerRsvp.waitlistPosition})`
            : null}
        </p>
      ) : (
        <p className="rsvp-status">You have not RSVP’d yet.</p>
      )}

      {!matchOpen ? (
        <p className="lede">RSVPs are closed for this match.</p>
      ) : (
        <div className="cta-row">
          <button
            type="button"
            className="btn"
            disabled={pending || !csrf || activeStatus === "going"}
            onClick={() => void postStatus("going")}
          >
            {pending ? "Saving…" : "Going"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={pending || !csrf}
            onClick={() => void postStatus("declined")}
          >
            Decline
          </button>
          {activeStatus ? (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pending || !csrf}
              onClick={() => void onCancelRsvp()}
            >
              Cancel RSVP
            </button>
          ) : null}
        </div>
      )}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
