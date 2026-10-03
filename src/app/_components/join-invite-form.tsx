"use client";

import { useState, type FormEvent } from "react";

export function JoinInviteForm() {
  const [code, setCode] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    window.location.assign(`/invite/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form className="join-form" onSubmit={onSubmit}>
      <h2 id="join-group-heading">Join with invite</h2>
      <div className="field">
        <label htmlFor="inviteCode">Invite code</label>
        <div className="join-row">
          <input
            id="inviteCode"
            name="inviteCode"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            aria-describedby="inviteCode-hint"
          />
          <button type="submit" className="btn" disabled={!code.trim()}>
            Continue
          </button>
        </div>
        <p id="inviteCode-hint" className="field-hint">
          Paste the code from your organizer — you will confirm on the next
          screen.
        </p>
      </div>
    </form>
  );
}
