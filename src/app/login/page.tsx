import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm, AuthLayout } from "@/components/auth-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <AuthLayout mode="login">
      <AuthForm mode="login" />
    </AuthLayout>
  );
}
