import { getDictionary } from "@/i18n/getDictionary";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { getApplication } from "@/lib/session";
import { getApplicationById } from "@/lib/data/applications";
import { ActivateAccountForm } from "@/components/auth/ActivateAccountForm";
import { LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return { title: dict.applicationStatus.title, robots: { index: false, follow: false } };
}


export default async function ApplicationPendingPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ app?: string }>;
}) {
  // The "your application is approved, activate now" email link carries the
  // application's own id (an unguessable uuid) so it works from ANY browser —
  // not just the one that originally submitted the application, which is what
  // the `hector_application` cookie alone requires. Cookie stays as the
  // fallback for the same-browser case (e.g. checking status right after
  // applying, with no id in the URL).
  const { app: applicationId } = await searchParams;
  const { lang } = await params;
  const locale = lang as Locale;
  const s = (await getDictionary(locale)).applicationStatus;
  const STEPS = [
    { key: "pending", label: s.stepSubmitted },
    { key: "review", label: s.stepReview },
    { key: "approved", label: s.stepApproved },
    { key: "active", label: s.stepActive },
  ] as const;
  const application = applicationId ? ((await getApplicationById(applicationId)) ?? null) : await getApplication();

  if (!application) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="font-display text-xl font-bold uppercase tracking-tight text-ink">{s.noApplication}</p>
        <p className="mt-2 text-sm text-ink-soft">{s.noApplicationBody}</p>
        <LinkButton href={withLocale(locale, "/apply")} className="mt-6 inline-flex">{s.applyForAccess}</LinkButton>
      </div>
    );
  }

  const currentIndex =
    application.status === "pending" ? 0 : application.status === "approved" ? 2 : 3;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 lg:px-10">
      <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">{s.eyebrow}</span>
      <h1 className="font-display mt-2 text-3xl font-bold uppercase tracking-tight text-ink">
        {application.businessName}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        {t(s.submittedOn, { date: formatDate(application.submittedAt, locale), name: application.contactName })}
      </p>

      {/* Stepper */}
      <div className="mt-10 flex items-center">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center border font-mono-tab text-sm font-semibold",
                  i <= currentIndex ? "border-ink bg-ink text-white" : "border-stone-300 bg-white text-ink-soft",
                )}
              >
                {i + 1}
              </div>
              <span className={cn("text-[11px] font-medium uppercase tracking-wide", i <= currentIndex ? "text-ink" : "text-ink-soft")}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("mx-2 h-[2px] flex-1", i < currentIndex ? "bg-ink" : "bg-stone-300")} />
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 border border-stone-300 bg-white p-6">
        {application.status === "pending" && (
          <>
            <p className="font-display text-lg font-bold uppercase tracking-tight text-ink">{s.underReview}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {t(s.underReviewBody, { email: application.email })}
            </p>
          </>
        )}
        {application.status === "approved" && (
          <>
            <p className="font-display text-lg font-bold uppercase tracking-tight text-positive">{s.approved}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {s.approvedBody}
            </p>
            <ActivateAccountForm applicationId={application.id} />
          </>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-ink-soft">
        {s.alreadyHaveAccount}{" "}
        <Link href={withLocale(locale, "/login")} className="text-signal underline">
          {s.signIn}
        </Link>
      </p>
    </div>
  );
}
