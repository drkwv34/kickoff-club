import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CreateInviteForm } from "@/app/_components/create-invite-form";
import { getServerSession } from "@/lib/http/server-session";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { getGroupsDeps } from "@/modules/groups/composition";
import { getGroupDetail } from "@/modules/groups/domain/get-group";
import { getMatchesDeps } from "@/modules/matches/composition";
import { listMatchesForGroup } from "@/modules/matches/domain/list-matches";
import { formatWallClock } from "@/modules/matches/domain/time-display";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const { groupId } = await params;
  try {
    const detail = await getGroupDetail(
      groupId,
      session.user.id,
      getGroupsDeps(),
    );
    const { matches } = await listMatchesForGroup(
      groupId,
      session.user.id,
      getMatchesDeps(),
    );
    const isOrganizer = detail.role === "organizer";

    return (
      <main className="shell">
        <p>
          <Link href="/app">← All groups</Link>
        </p>
        <h1>{detail.group.name}</h1>
        <p className="lede">
          {detail.group.sportDefault} · {detail.group.homeTimezone}
          {detail.group.description ? ` · ${detail.group.description}` : ""}
        </p>
        <p>
          Your role: <span className="role-badge">{detail.role}</span>
        </p>

        <h2>Members</h2>
        <ul className="member-list">
          {detail.members.map((member) => (
            <li key={member.userId}>
              {member.displayName}{" "}
              <span className="role-badge">{member.role}</span>
            </li>
          ))}
        </ul>

        <h2>Matches</h2>
        {isOrganizer ? (
          <p>
            <Link className="btn btn-secondary" href={`/app/groups/${groupId}/matches/new`}>
              Create match
            </Link>
          </p>
        ) : null}
        {matches.length === 0 ? (
          <p className="empty-state">
            No matches yet — organizers can schedule a pickup session.
          </p>
        ) : (
          <ul className="match-list">
            {matches.map((match) => (
              <li key={match.id}>
                <Link href={`/app/matches/${match.id}`}>
                  {match.title}
                  {match.status === "cancelled" ? " (cancelled)" : ""}
                </Link>
                <span className="match-list-meta">
                  {formatWallClock(match.startAt, match.timezone)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {isOrganizer ? <CreateInviteForm groupId={groupId} /> : null}
      </main>
    );
  } catch (err) {
    if (
      err instanceof DomainError &&
      (err.code === DomainErrorCode.NOT_FOUND ||
        err.code === DomainErrorCode.FORBIDDEN)
    ) {
      notFound();
    }
    throw err;
  }
}
