import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccountForAudience } from "@/lib/session";
import { ApplyForm } from "@/components/auth/ApplyForm";
import { countryOptions, defaultCountryForLocale } from "@/lib/countries";
import { pageMetadata } from "@/lib/seo";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return pageMetadata({
    title: dict.seo.applyTitle,
    description: dict.seo.applyDescription,
    path: "/apply",
    locale,
  });
}

export default async function ApplyPage({ params }: { params: Promise<{ lang: string; audience?: string }> }) {
  const { lang, audience } = await params;
  const account = await getAccountForAudience(audience);
  if (account) redirect(account.role === "admin" ? "/admin" : "/dashboard");

  const dict = await getDictionary(lang as Locale);
  return (
    <ApplyForm
      countries={countryOptions(lang, dict.apply.countryOther)}
      defaultCountry={defaultCountryForLocale(lang)}
    />
  );
}
