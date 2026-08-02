import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { ApplyForm } from "@/components/auth/ApplyForm";
import { pageMetadata } from "@/lib/seo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Apply for Wholesale Access",
    description:
      "Apply for a Hector 1984 wholesale account. Tell us about your store — resale certificate, expected volume, and location. Most applications are reviewed within 2 business days.",
    path: "/apply",
  });
}

export default async function ApplyPage() {
  const account = await getCurrentAccount();
  if (account) redirect(account.role === "admin" ? "/admin" : "/dashboard");

  return <ApplyForm />;
}
