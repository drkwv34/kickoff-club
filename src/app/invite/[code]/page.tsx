import Link from "next/link";
import { AcceptInviteButton } from "@/app/_components/accept-invite-button";
import { getServerSession } from "@/lib/http/server-session";
import { DomainError, DomainErrorCode } from "@/lib/errors/domain-error";
import { getGroupsDeps } from "@/modules/groups/composition";
import { previewInvite } from "@/modules/groups/domain/accept-invite";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const session = await getServerSession();
  const { code } = await params;

  try {
    const preview = await previewInvite(code, getGroupsDeps());
    const next = `/invite/${encodeURIComponent(code)}`;

    return (
      <main className="shell">
        <h1>Join {preview.group.name}</h1>
        <p className="lede">
          {preview.group.sportDefault} · {preview.group.homeTimezone}. Invite
          expires {new Date(preview.expiresAt).toLocaleString()}.
        </p>
        {session ? (
          <AcceptInviteButton code={code} groupName={preview.group.name} />
        ) : (
          <p className="cta-row">
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="btn"
            >
              Sign in to join
            </Link>
            <Link
              href={`/register?next=${encodeURIComponent(next)}`}
              className="btn btn-quiet"
            >
              Register
            </Link>
          </p>
        )}
      </main>
    );
  } catch (err) {
    const expired =
      err instanceof DomainError && err.code === DomainErrorCode.GONE;
    return (
      <main className="shell">
        <h1>{expired ? "Invite expired" : "Invite not found"}</h1>
        <p className="empty">
          {expired
            ? "This invite has expired or has no uses left. Ask an organizer for a new link."
            : "That invite code is invalid."}
        </p>
        <p>
          <Link href={session ? "/app" : "/login"}>
            {session ? "Back to groups" : "Sign in"}
          </Link>
        </p>
      </main>
    );
  }
}
