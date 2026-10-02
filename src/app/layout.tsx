import type { Metadata } from "next";
import { SiteHeader } from "./_components/site-header";
import { getServerSession } from "@/lib/http/server-session";
import { getNotificationsDeps, getUnreadNotificationCount } from "@/modules/notifications";
import "./globals.css";

export const metadata: Metadata = {
  title: "kickoff-club",
  description: "Pickup-sports match organizer",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  const unreadNotifications =
    session
      ? await getUnreadNotificationCount(session.user.id, getNotificationsDeps())
      : 0;
  return (
    <html lang="en">
      <body>
        <SiteHeader
          user={session?.user ?? null}
          unreadNotifications={unreadNotifications}
        />
        {children}
      </body>
    </html>
  );
}
