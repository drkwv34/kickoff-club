import { redirect } from "next/navigation";
import { AuthForm } from "../_components/auth-form";
import { getServerSession } from "@/lib/http/server-session";

export default async function RegisterPage() {
  const session = await getServerSession();
  if (session) redirect("/app");

  return (
    <main className="shell">
      <h1>Create an account</h1>
      <p className="lede">
        Register with email and a password of at least 12 characters.
      </p>
      <AuthForm mode="register" />
    </main>
  );
}
