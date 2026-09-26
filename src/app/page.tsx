import { loadEnv } from "@/lib/config/env";

export default function HomePage() {
  const env = loadEnv();
  return (
    <main className="shell">
      <h1>kickoff-club</h1>
      <p className="lede">
        Architecture-first scaffold — product features arrive via OpenSpec.
      </p>
      <p className="meta">
        Environment: <code>{env.NODE_ENV}</code>
      </p>
    </main>
  );
}
