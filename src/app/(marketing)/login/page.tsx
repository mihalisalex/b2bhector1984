import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Buyer Login",
  description: "Sign in to your Hector 1984 wholesale account for full pricing, matrix ordering, and order history.",
};

export default async function LoginPage() {
  const account = await getCurrentAccount();
  if (account) redirect(account.role === "admin" ? "/admin" : "/dashboard");

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
