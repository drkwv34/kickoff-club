import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "../_components/forgot-password-form";
import { getServerSession } from "@/lib/http/server-session";

export default async function ForgotPasswordPage() {
  const session = await getServerSession();
  if (session) redirect("/app");

  return (
    <main className="shell">
      <h1>Forgot password</h1>
      <p className="lede">
        Enter the email you registered with. We will send a reset link if an
        account exists. <Link href="/login">Back to sign in</Link>
      </p>
      <ForgotPasswordForm />
    </main>
  );
}
