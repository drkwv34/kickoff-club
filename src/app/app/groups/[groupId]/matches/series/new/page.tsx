import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CreateSeriesForm } from "@/app/_components/create-series-form";
import { getServerSession } from "@/lib/http/server-session";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { getGroupsDeps } from "@/modules/groups/composition";
import { getGroupDetail } from "@/modules/groups/domain/get-group";

export default async function NewSeriesPage({
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
    if (detail.role !== "organizer") {
      notFound();
    }

    return (
      <main className="shell">
        <p>
          <Link href={`/app/groups/${groupId}`}>← {detail.group.name}</Link>
        </p>
        <CreateSeriesForm
          groupId={groupId}
          defaultTimezone={detail.group.homeTimezone}
          defaultSport={detail.group.sportDefault}
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
