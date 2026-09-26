"use client";

import { useState } from "react";
import { useCsrfToken } from "./use-csrf-token";

export function AcceptInviteButton({
  code,
  groupName,
}: {
  code: string;
  groupName: string;
}) {
  const csrf = useCsrfToken();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAccept() {
    if (!csrf) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/invites/${encodeURIComponent(code)}/accept`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({}),
      });
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        group?: { id: string };
      };
      if (!res.ok) {
        setError(body.message ?? "Could not join group");
        setPending(false);
        return;
      }
      if (body.group?.id) {
        window.location.assign(`/app/groups/${body.group.id}`);
        return;
      }
      window.location.assign("/app");
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  return (
    <div className="cta-row">
      <button
        type="button"
        className="btn"
        onClick={() => void onAccept()}
        disabled={!csrf || pending}
      >
        {pending ? "Joining…" : `Join ${groupName}`}
      </button>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
