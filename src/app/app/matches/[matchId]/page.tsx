import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CancelMatchButton } from "@/app/_components/cancel-match-button";
import { getServerSession } from "@/lib/http/server-session";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { getGroupsDeps } from "@/modules/groups/composition";
import { getGroupDetail } from "@/modules/groups/domain/get-group";
import { getMatchesDeps } from "@/modules/matches/composition";
import { getMatchDetail } from "@/modules/matches/domain/get-match";
import { presentMatchTimes } from "@/modules/matches/domain/time-display";
import { getMatchRsvpSummary, getRsvpsDeps } from "@/modules/rsvps";
import { MarkNoShowControls } from "@/app/_components/mark-no-show-controls";
import { RsvpControls } from "@/app/_components/rsvp-controls";
import { listGoingUserIdsForOrganizer } from "@/modules/rsvps/domain/list-going-for-organizer";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const { matchId } = await params;
  try {
    const { match } = await getMatchDetail(
      matchId,
      session.user.id,
      getMatchesDeps(),
    );
    const groupDetail = await getGroupDetail(
      match.groupId,
      session.user.id,
      getGroupsDeps(),
    );
    const isOrganizer = groupDetail.role === "organizer";
    const times = presentMatchTimes({
      startAt: match.startAt,
      endAt: match.endAt,
      matchTimeZone: match.timezone,
      viewerTimeZone: session.user.timezone,
    });
    const rsvpSummary = await getMatchRsvpSummary(
      match.id,
      session.user.id,
      getRsvpsDeps(),
    );
    const matchOpen =
      match.status === "scheduled" &&
      new Date(match.startAt).getTime() > Date.now();
    const matchStarted = new Date(match.startAt).getTime() <= Date.now();
    const goingForNoShow =
      isOrganizer && matchStarted && match.status === "scheduled"
        ? await listGoingUserIdsForOrganizer(
            match.id,
            session.user.id,
            getRsvpsDeps(),
          )
        : [];
    const noShowPlayers = groupDetail.members
      .filter((m) => goingForNoShow.includes(m.userId))
      .map((m) => ({ userId: m.userId, displayName: m.displayName }));

    return (
      <main className="shell">
        <p className="breadcrumb">
          <Link href={`/app/groups/${match.groupId}`}>
            ← {groupDetail.group.name}
          </Link>
        </p>
        <h1>{match.title}</h1>
        <p className="lede">
          {match.sport} · {match.venue} · capacity {match.capacity}
          {match.status === "cancelled" ? (
            <span className="status-badge status-cancelled"> Cancelled</span>
          ) : null}
        </p>

        <section className="match-schedule" aria-labelledby="match-time-heading">
          <h2 id="match-time-heading">When</h2>
          <p>
            <strong>Start:</strong> {times.start.matchWall}{" "}
            <span className="tz-label">({match.timezone})</span>
          </p>
          {times.start.viewerWall ? (
            <p className="tz-hint">
              For you ({session.user.timezone}): {times.start.viewerWall}
            </p>
          ) : null}
          <p>
            <strong>End:</strong> {times.end.matchWall}{" "}
            <span className="tz-label">({match.timezone})</span>
          </p>
          {times.end.viewerWall ? (
            <p className="tz-hint">
              For you ({session.user.timezone}): {times.end.viewerWall}
            </p>
          ) : null}
        </section>

        {match.description ? (
          <section>
            <h2>Details</h2>
            <p>{match.description}</p>
          </section>
        ) : null}

        <RsvpControls
          matchId={match.id}
          capacity={match.capacity}
          goingCount={rsvpSummary.goingCount}
          viewerRsvp={rsvpSummary.viewerRsvp}
          matchOpen={matchOpen}
        />

        {isOrganizer && match.status === "scheduled" && !matchStarted ? (
          <CancelMatchButton matchId={match.id} />
        ) : null}

        {isOrganizer && matchStarted && match.status === "scheduled" ? (
          <MarkNoShowControls matchId={match.id} players={noShowPlayers} />
        ) : null}
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
