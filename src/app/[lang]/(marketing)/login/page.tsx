import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { LoginForm } from "@/components/auth/LoginForm";
import { pageMetadata } from "@/lib/seo";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return pageMetadata({
    title: dict.seo.loginTitle,
    description: dict.seo.loginDescription,
    path: "/login",
    locale,
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
