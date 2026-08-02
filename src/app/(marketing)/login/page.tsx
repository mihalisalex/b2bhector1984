import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { LoginForm } from "@/components/auth/LoginForm";
import { pageMetadata } from "@/lib/seo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Buyer Login",
    description: "Sign in to your Hector 1984 wholesale account for full pricing, matrix ordering, and order history.",
    path: "/login",
  });
}

export default async function LoginPage() {
  const account = await getCurrentAccount();
  if (account) redirect(account.role === "admin" ? "/admin" : "/dashboard");

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
