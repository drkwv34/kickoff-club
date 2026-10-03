"use client";

import { useState, type FormEvent } from "react";
import { useCsrfToken } from "./use-csrf-token";

type Invite = {
  code: string;
  acceptPath: string;
  expiresAt: string;
  maxUses: number;
  useCount: number;
};

export function CreateInviteForm({ groupId }: { groupId: string }) {
  const csrf = useCsrfToken();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<Invite | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!csrf) return;
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const maxUsesRaw = String(form.get("maxUses") ?? "50");
    const maxUses = Number.parseInt(maxUsesRaw, 10);

    try {
      const res = await fetch(`/api/v1/groups/${groupId}/invites`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({ maxUses }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        invite?: Invite;
      };
      if (!res.ok || !body.invite) {
        setError(body.message ?? "Could not create invite");
        setPending(false);
        return;
      }
      setInvite(body.invite);
      setPending(false);
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  return (
    <section className="panel">
      <h2>Invite players</h2>
      <form className="invite-form" onSubmit={(e) => void onSubmit(e)}>
        <div className="field">
          <label htmlFor="maxUses">Max uses (1–50)</label>
          <input
            id="maxUses"
            name="maxUses"
            type="number"
            min={1}
            max={50}
            defaultValue={50}
            disabled={pending || !csrf}
            aria-describedby="maxUses-hint"
          />
          <p id="maxUses-hint" className="field-hint">
            How many players can use this invite link before it stops working.
          </p>
        </div>
        <button type="submit" className="btn" disabled={pending || !csrf}>
          {pending ? "Creating…" : "Create invite link"}
        </button>
      </form>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {invite ? (
        <p className="invite-result">
          Share this link: <code>{invite.acceptPath}</code>
          <br />
          Code: <code>{invite.code}</code>
        </p>
      ) : null}
    </section>
  );
}
