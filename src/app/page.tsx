import Link from "next/link";
import { getServerSession } from "@/lib/http/server-session";

export default async function HomePage() {
  const session = await getServerSession();
  return (
    <main className="shell">
      <h1>kickoff-club</h1>
      <p className="lede">
        Organize pickup matches for local sports groups — RSVPs, waitlists, and
        timezone-aware schedules.
      </p>
      {session ? (
        <p>
          Signed in as <strong>{session.user.displayName}</strong>.{" "}
          <Link href="/app">Go to app</Link>
        </p>
      ) : (
        <p className="cta-row">
          <Link href="/register" className="btn">
            Register
          </Link>
          <Link href="/login" className="btn btn-quiet">
            Sign in
          </Link>
        </p>
      )}
    </main>
  );
}
