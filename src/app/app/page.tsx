import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateGroupForm } from "../_components/create-group-form";
import { EmptyState } from "../_components/empty-state";
import { JoinInviteForm } from "../_components/join-invite-form";
import { getServerSession } from "@/lib/http/server-session";
import { getGroupsDeps } from "@/modules/groups/composition";
import { listGroupsForUser } from "@/modules/groups/domain/list-groups";

export default async function AppHomePage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const groups = await listGroupsForUser(session.user.id, getGroupsDeps());

  return (
    <main className="shell">
      <h1>Your groups</h1>
      <p className="lede">
        Signed in as <strong>{session.user.displayName}</strong> (
        {session.user.email}). Timezone: {session.user.timezone}.
      </p>

      {groups.length === 0 ? (
        <EmptyState title="No groups yet">
          <p>
            Create a group for your regular pickup crew, or join an existing
            one with an invite code from an organizer.
          </p>
        </EmptyState>
      ) : (
        <section aria-labelledby="your-groups-heading">
          <h2 id="your-groups-heading" className="section-heading">
            Groups you belong to
          </h2>
          <ul className="group-list">
            {groups.map((item) => (
              <li key={item.group.id} className="group-card">
                <Link href={`/app/groups/${item.group.id}`}>
                  {item.group.name}
                </Link>
                <span className="role-badge">{item.role}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="join-group-heading">
        <JoinInviteForm />
      </section>
      <section aria-labelledby="create-group-heading">
        <CreateGroupForm />
      </section>
    </main>
  );
}
