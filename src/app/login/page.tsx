import { redirect } from "next/navigation";
import { AuthForm } from "../_components/auth-form";
import { getServerSession } from "@/lib/http/server-session";

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) redirect("/app");

  return (
    <main className="shell">
      <h1>Sign in</h1>
      <p className="lede">Welcome back. Use the email you registered with.</p>
      <AuthForm mode="login" />
    </main>
  );
}
