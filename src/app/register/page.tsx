import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "../_components/auth-form";
import { safeNextPath } from "../_components/safe-next-path";
import { getServerSession } from "@/lib/http/server-session";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getServerSession();
  const { next } = await searchParams;
  if (session) redirect(safeNextPath(next));

  return (
    <main className="shell">
      <h1>Create an account</h1>
      <p className="lede">
        Register with email and a password of at least 12 characters.{" "}
        <Link href="/">Back to home</Link>
      </p>
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </main>
  );
}
