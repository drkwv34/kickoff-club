import { redirect } from "next/navigation";
import { NotificationsList } from "@/app/_components/notifications-list";
import { getServerSession } from "@/lib/http/server-session";
import { getNotificationsDeps, listNotifications } from "@/modules/notifications";

export default async function NotificationsPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const { notifications, unreadCount } = await listNotifications(
    session.user.id,
    getNotificationsDeps(),
  );

  return (
    <main className="shell">
      <h1>Notifications</h1>
      <NotificationsList
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
      />
    </main>
  );
}
