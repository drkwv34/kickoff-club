import Link from "next/link";

type Props = {
  unreadCount: number;
};

export function NotificationsNav({ unreadCount }: Props) {
  return (
    <Link href="/app/notifications" className="notifications-link">
      Notifications
      {unreadCount > 0 ? (
        <span className="notifications-badge" aria-label={`${unreadCount} unread`}>
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
