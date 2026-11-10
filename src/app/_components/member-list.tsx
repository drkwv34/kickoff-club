"use client";

import { useState } from "react";
import type { MembershipRole } from "@/modules/groups/domain/types";
import { useCsrfToken } from "./use-csrf-token";

export type MemberListItem = {
  userId: string;
  displayName: string;
  role: MembershipRole;
  noShowCount: number;
};

type Props = {
  groupId: string;
  viewerUserId: string;
  viewerRole: MembershipRole;
  members: MemberListItem[];
};

export function MemberList({
  groupId,
  viewerUserId,
  viewerRole,
  members,
}: Props) {
  const csrf = useCsrfToken();
  const [rows, setRows] = useState(members);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOrganizer = viewerRole === "organizer";

  async function changeRole(userId: string, role: MembershipRole) {
    if (!csrf || pendingUserId) return;
    setPendingUserId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/members/${userId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({ role }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        code?: string;
        message?: string;
      };
      if (!res.ok) {
        setError(body.message ?? "Could not update role");
        setPendingUserId(null);
        return;
      }
      setRows((current) =>
        current.map((member) =>
          member.userId === userId ? { ...member, role } : member,
        ),
      );
      setPendingUserId(null);
    } catch {
      setError("Network error. Try again.");
      setPendingUserId(null);
    }
  }

  async function leaveGroup() {
    if (!csrf || pendingUserId) return;
    setPendingUserId(viewerUserId);
    setError(null);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/membership`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "x-csrf-token": csrf },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          code?: string;
          message?: string;
        };
        setError(body.message ?? "Could not leave group");
        setPendingUserId(null);
        return;
      }
      window.location.assign("/app");
    } catch {
      setError("Network error. Try again.");
      setPendingUserId(null);
    }
  }

  return (
    <div className="member-list-wrap">
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="member-list" aria-labelledby="members-heading">
        {rows.map((member) => {
          const isSelf = member.userId === viewerUserId;
          const busy = pendingUserId === member.userId;
          return (
            <li key={member.userId} className="member-row">
              <div className="member-meta">
                <span>{member.displayName}</span>{" "}
                <span className="role-badge">{member.role}</span>
                <span className="no-show-count">
                  {member.noShowCount} no-shows
                </span>
              </div>
              <div className="member-actions">
                {isOrganizer && !isSelf && member.role === "player" ? (
                  <button
                    type="button"
                    className="btn btn-small btn-secondary"
                    disabled={!csrf || Boolean(pendingUserId)}
                    onClick={() => void changeRole(member.userId, "organizer")}
                  >
                    {busy ? "Saving…" : "Promote"}
                  </button>
                ) : null}
                {isOrganizer && !isSelf && member.role === "organizer" ? (
                  <button
                    type="button"
                    className="btn btn-small btn-secondary"
                    disabled={!csrf || Boolean(pendingUserId)}
                    onClick={() => void changeRole(member.userId, "player")}
                  >
                    {busy ? "Saving…" : "Demote"}
                  </button>
                ) : null}
                {isSelf ? (
                  <button
                    type="button"
                    className="btn btn-small btn-quiet"
                    disabled={!csrf || Boolean(pendingUserId)}
                    onClick={() => void leaveGroup()}
                  >
                    {busy ? "Leaving…" : "Leave group"}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
