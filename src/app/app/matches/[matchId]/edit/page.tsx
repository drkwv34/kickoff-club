import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditMatchForm } from "@/app/_components/edit-match-form";
import { getServerSession } from "@/lib/http/server-session";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { getGroupsDeps } from "@/modules/groups/composition";
import { getGroupDetail } from "@/modules/groups/domain/get-group";
import { getMatchesDeps } from "@/modules/matches/composition";
import { getMatchDetail } from "@/modules/matches/domain/get-match";
import { wallClockInZone } from "@/modules/matches/domain/wall-clock";

export default async function EditMatchPage({
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
    if (groupDetail.role !== "organizer" || match.status !== "scheduled") {
      notFound();
    }

    const start = wallClockInZone(match.startAt, match.timezone);
    const end = wallClockInZone(match.endAt, match.timezone);

    return (
      <main className="shell">
        <p className="breadcrumb">
          <Link href={`/app/matches/${match.id}`}>← {match.title}</Link>
        </p>
        <EditMatchForm
          matchId={match.id}
          groupId={match.groupId}
          title={match.title}
          sport={match.sport}
          venue={match.venue}
          date={start.date}
          startTime={start.time}
          endTime={end.time}
          timezone={match.timezone}
          capacity={match.capacity}
          description={match.description ?? ""}
        />
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
