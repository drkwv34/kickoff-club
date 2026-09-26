import Link from "next/link";
import type { PublicUser } from "@/modules/auth/domain/user";
import { LogoutButton } from "./logout-button";

export function SiteHeader({ user }: { user: PublicUser | null }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href={user ? "/app" : "/"} className="brand">
          kickoff-club
        </Link>
        <nav className="nav" aria-label="Primary">
          {user ? (
            <>
              <span className="nav-user">{user.displayName}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/register" className="btn btn-small">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
