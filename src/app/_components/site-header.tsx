import Link from "next/link";
import type { PublicUser } from "@/modules/auth/domain/user";
import { LogoutButton } from "./logout-button";
import { NotificationsNav } from "./notifications-nav";

function PrimaryNavLinks({
  user,
  unreadNotifications,
}: {
  user: PublicUser | null;
  unreadNotifications: number;
}) {
  if (user) {
    return (
      <>
        <Link href="/app">Dashboard</Link>
        <NotificationsNav unreadCount={unreadNotifications} />
        <Link href="/app/settings">Settings</Link>
        <span className="nav-user">{user.displayName}</span>
        <LogoutButton />
      </>
    );
  }
  return (
    <>
      <Link href="/login">Sign in</Link>
      <Link href="/register" className="btn btn-small">
        Register
      </Link>
    </>
  );
}

export function SiteHeader({
  user,
  unreadNotifications = 0,
}: {
  user: PublicUser | null;
  unreadNotifications?: number;
}) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href={user ? "/app" : "/"} className="brand">
          kickoff-club
        </Link>
        <nav className="nav" aria-label="Primary">
          <details className="nav-menu">
            <summary className="nav-menu-toggle">Menu</summary>
            <div className="nav-menu-panel">
              <PrimaryNavLinks
                user={user}
                unreadNotifications={unreadNotifications}
              />
            </div>
          </details>
          <div className="nav-inline">
            <PrimaryNavLinks
              user={user}
              unreadNotifications={unreadNotifications}
            />
          </div>
        </nav>
      </div>
    </header>
  );
}
