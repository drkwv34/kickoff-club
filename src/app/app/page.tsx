import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/http/server-session";

export default async function AppHomePage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="shell">
      <h1>Your groups</h1>
      <p className="lede">
        Signed in as <strong>{session.user.displayName}</strong> (
        {session.user.email}). Timezone: {session.user.timezone}.
      </p>
      <p className="empty">
        You’re not in any groups yet. Group create/join lands in a later change.
      </p>
    </main>
  );
}
