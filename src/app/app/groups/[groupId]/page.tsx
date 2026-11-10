import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CreateInviteForm } from "@/app/_components/create-invite-form";
import { EmptyState } from "@/app/_components/empty-state";
import { MatchList } from "@/app/_components/match-list";
import { MatchListFilters } from "@/app/_components/match-list-filters";
import { MemberList } from "@/app/_components/member-list";
import { getServerSession } from "@/lib/http/server-session";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { getGroupsDeps } from "@/modules/groups/composition";
import { getGroupDetail } from "@/modules/groups/domain/get-group";
import { getMatchesDeps } from "@/modules/matches/composition";
import { listMatchesForGroup } from "@/modules/matches/domain/list-matches";
import { parseMatchListQuery } from "@/modules/matches/validation";

const UI_MATCH_PAGE_SIZE = 10;

function firstValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const { groupId } = await params;
  const rawParams = searchParams ? await searchParams : {};
  const query = new URLSearchParams();
  for (const key of ["when", "status", "from", "to"] as const) {
    const value = firstValue(rawParams[key]);
    if (value) query.set(key, value);
  }
  const filters = parseMatchListQuery(query);

  try {
    const detail = await getGroupDetail(
      groupId,
      session.user.id,
      getGroupsDeps(),
    );
    const { matches, nextCursor } = await listMatchesForGroup(
      groupId,
      session.user.id,
      getMatchesDeps(),
      { ...filters, limit: UI_MATCH_PAGE_SIZE },
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
          <MemberList
            groupId={groupId}
            viewerUserId={session.user.id}
            viewerRole={detail.role}
            members={detail.members}
          />
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
          <MatchListFilters
            when={filters.when}
            status={filters.status}
            from={firstValue(rawParams.from)}
            to={firstValue(rawParams.to)}
          />
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
            <MatchList
              groupId={groupId}
              initialMatches={matches}
              initialCursor={nextCursor}
              queryString={query.toString()}
            />
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
