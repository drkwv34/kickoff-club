import Link from "next/link";
import { getServerSession } from "@/lib/http/server-session";

const FEATURES = [
  {
    title: "Groups & invites",
    body: "Create a pickup group, invite players with a code, and keep roles straight for organizers.",
  },
  {
    title: "Matches & series",
    body: "Schedule one-off games or recurring series with timezone-aware start times.",
  },
  {
    title: "RSVPs & waitlists",
    body: "Players RSVP with capacity limits; waitlisted members promote automatically when a spot opens.",
  },
  {
    title: "Stay in the loop",
    body: "In-app notifications (and dev email via Mailpit) for invites, promotions, and cancellations.",
  },
];

export default async function HomePage() {
  const session = await getServerSession();
  return (
    <main className="landing">
      <section className="landing-hero shell" aria-labelledby="landing-title">
        <h1 id="landing-title">kickoff-club</h1>
        <p className="lede landing-lede">
          Organize pickup matches for local sports groups — RSVPs, waitlists,
          and timezone-aware schedules without spreadsheet chaos.
        </p>
        {session ? (
          <div className="landing-cta">
            <p>
              Signed in as <strong>{session.user.displayName}</strong>.
            </p>
            <Link href="/app" className="btn">
              Open your dashboard
            </Link>
          </div>
        ) : (
          <div className="cta-row landing-cta">
            <Link href="/register" className="btn">
              Create free account
            </Link>
            <Link href="/login" className="btn btn-quiet">
              Sign in
            </Link>
          </div>
        )}
      </section>

      <section
        className="landing-features shell"
        aria-labelledby="features-heading"
      >
        <h2 id="features-heading">How it works</h2>
        <ol className="feature-list">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </li>
          ))}
        </ol>
        {!session ? (
          <p className="landing-footer-cta">
            Ready to run your next game?{" "}
            <Link href="/register">Register in under a minute</Link>.
          </p>
        ) : null}
      </section>
    </main>
  );
}
