import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "../_components/reset-password-form";
import { getServerSession } from "@/lib/http/server-session";

export default async function ResetPasswordPage() {
  const session = await getServerSession();
  if (session) redirect("/app");

  return (
    <main className="shell">
      <h1>Reset password</h1>
      <p className="lede">
        Choose a new password of at least 12 characters.{" "}
        <Link href="/login">Back to sign in</Link>
      </p>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
