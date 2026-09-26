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
      <label htmlFor="inviteCode">Have an invite code?</label>
      <div className="join-row">
        <input
          id="inviteCode"
          name="inviteCode"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="btn" disabled={!code.trim()}>
          Continue
        </button>
      </div>
    </form>
  );
}
