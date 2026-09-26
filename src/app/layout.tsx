import type { Metadata } from "next";
import { SiteHeader } from "./_components/site-header";
import { getServerSession } from "@/lib/http/server-session";
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
  return (
    <html lang="en">
      <body>
        <SiteHeader user={session?.user ?? null} />
        {children}
      </body>
    </html>
  );
}
