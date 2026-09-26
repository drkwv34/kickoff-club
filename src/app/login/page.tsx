import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "../_components/auth-form";
import { safeNextPath } from "../_components/safe-next-path";
import { getServerSession } from "@/lib/http/server-session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getServerSession();
  const { next } = await searchParams;
  if (session) redirect(safeNextPath(next));

  return (
    <main className="shell">
      <h1>Sign in</h1>
      <p className="lede">Welcome back. Use the email you registered with.</p>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
