"use client";

import { useState } from "react";
import type { PublicNotification } from "@/modules/notifications";
import { EmptyState } from "./empty-state";
import { useCsrfToken } from "./use-csrf-token";

type Props = {
  initialNotifications: PublicNotification[];
  initialUnreadCount: number;
};

function describeNotification(item: PublicNotification): string {
  const title = String(item.payload.matchTitle ?? item.payload.groupName ?? "");
  switch (item.type) {
    case "waitlist_promoted":
      return `Promoted to going: ${title}`;
    case "rsvp_confirmed":
      return `RSVP confirmed: ${title}`;
    case "match_cancelled":
      return `Match cancelled: ${title}`;
    case "invite_received":
      return `Joined group: ${title}`;
    case "no_show_marked":
      return `No-show marked: ${title}`;
    default:
      return item.type;
  }
}

export function NotificationsList({
  initialNotifications,
  initialUnreadCount,
}: Props) {
  const csrf = useCsrfToken();
  const [items, setItems] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnreadCount);
  const [pending, setPending] = useState(false);

  async function markAllRead() {
    if (!csrf || pending || unread === 0) return;
    setPending(true);
    try {
      const res = await fetch("/api/v1/notifications/read", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) return;
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt ?? now })),
      );
      setUnread(0);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="notifications-toolbar">
        <p className="lede">{unread} unread</p>
        <button
          type="button"
          className="btn btn-small"
          disabled={pending || unread === 0 || !csrf}
          onClick={() => void markAllRead()}
        >
          Mark all read
        </button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No notifications yet">
          <p>
            You will see invites, RSVP updates, and match changes here as they
            happen.
          </p>
        </EmptyState>
      ) : (
        <ul className="notifications-list">
          {items.map((item) => (
            <li
              key={item.id}
              className={item.readAt ? "notification-read" : "notification-unread"}
            >
              <p>{describeNotification(item)}</p>
              <time dateTime={item.createdAt}>
                {new Date(item.createdAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
