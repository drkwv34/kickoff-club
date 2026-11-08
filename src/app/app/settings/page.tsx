import { redirect } from "next/navigation";
import { SettingsProfileForm } from "../../_components/settings-profile-form";
import { getServerSession } from "@/lib/http/server-session";

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login?next=/app/settings");
  }

  return (
    <main className="shell">
      <h1>Settings</h1>
      <p className="lede">
        Update how your name and timezone appear across kickoff-club.
      </p>
      <SettingsProfileForm
        displayName={session.user.displayName}
        timezone={session.user.timezone}
      />
    </main>
  );
}
