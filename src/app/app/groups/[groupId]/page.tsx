import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CreateInviteForm } from "@/app/_components/create-invite-form";
import { EmptyState } from "@/app/_components/empty-state";
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
        <p className="breadcrumb">
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

        <section aria-labelledby="members-heading">
          <h2 id="members-heading">Members</h2>
          <ul className="member-list">
            {detail.members.map((member) => (
              <li key={member.userId}>
                {member.displayName}{" "}
                <span className="role-badge">{member.role}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="matches-heading">
          <h2 id="matches-heading">Matches</h2>
          {isOrganizer ? (
            <p className="organizer-actions">
              <Link
                className="btn btn-secondary"
                href={`/app/groups/${groupId}/matches/new`}
              >
                Create match
              </Link>
              {" "}
              <Link
                className="btn btn-secondary"
                href={`/app/groups/${groupId}/matches/series/new`}
              >
                Create series
              </Link>
            </p>
          ) : null}
          {matches.length === 0 ? (
            <EmptyState
              title={isOrganizer ? "No matches scheduled" : "No upcoming matches"}
            >
              {isOrganizer ? (
                <p>
                  Create a one-off match or a recurring series so players can
                  RSVP.
                </p>
              ) : (
                <p>
                  Organizers schedule pickup sessions here. You will see matches
                  listed once they are created — check back or ask your organizer.
                </p>
              )}
            </EmptyState>
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
        </section>

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
