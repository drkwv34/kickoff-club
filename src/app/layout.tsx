import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "kickoff-club",
  description: "Pickup-sports match organizer (scaffold)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
