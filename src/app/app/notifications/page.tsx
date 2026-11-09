import { redirect } from "next/navigation";
import { NotificationPreferencesForm } from "@/app/_components/notification-preferences-form";
import { NotificationsList } from "@/app/_components/notifications-list";
import { getServerSession } from "@/lib/http/server-session";
import {
  getNotificationsDeps,
  listNotificationPreferences,
  listNotifications,
} from "@/modules/notifications";

export default async function NotificationsPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const deps = getNotificationsDeps();
  const [{ notifications, unreadCount }, { preferences }] = await Promise.all([
    listNotifications(session.user.id, deps),
    listNotificationPreferences(session.user.id, deps),
  ]);

  return (
    <main className="shell">
      <h1>Notifications</h1>
      <NotificationsList
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
      />
      <NotificationPreferencesForm initialPreferences={preferences} />
    </main>
  );
}
