import Link from "next/link";
import { getApplication } from "@/lib/session";
import { activateAccount } from "@/lib/actions";
import { Button, LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export const metadata = { title: "Application Status", robots: { index: false, follow: false } };

const STEPS = [
  { key: "pending", label: "Submitted" },
  { key: "review", label: "In Review" },
  { key: "approved", label: "Approved" },
  { key: "active", label: "Active" },
] as const;

export default async function ApplicationPendingPage() {
  const application = await getApplication();

  if (!application) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="font-display text-xl font-bold uppercase tracking-tight text-ink">No application on file</p>
        <p className="mt-2 text-sm text-ink-soft">Start a new wholesale application to see its status here.</p>
        <LinkButton href="/apply" className="mt-6 inline-flex">Apply for Access</LinkButton>
      </div>
    );
  }

  const currentIndex =
    application.status === "pending" ? 0 : application.status === "approved" ? 2 : 3;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 lg:px-10">
      <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">Application Status</span>
      <h1 className="font-display mt-2 text-3xl font-bold uppercase tracking-tight text-ink">
        {application.businessName}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Submitted {new Date(application.submittedAt).toLocaleDateString("en-US")} · {application.contactName}
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
            <p className="font-display text-lg font-bold uppercase tracking-tight text-ink">Under Review</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              A member of our wholesale team is verifying your resale certificate and business
              details. This typically takes 1–2 business days. We&rsquo;ll email {application.email}{" "}
              once a decision is made.
            </p>
          </>
        )}
        {application.status === "approved" && (
          <>
            <p className="font-display text-lg font-bold uppercase tracking-tight text-positive">Approved</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              You&rsquo;re approved for a wholesale account. Activate it now to set your login and
              start browsing the full catalog with pricing.
            </p>
            <form action={activateAccount} className="mt-4">
              <Button type="submit" size="lg">Activate My Account</Button>
            </form>
          </>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-ink-soft">
        Already have an account? <Link href="/login" className="text-signal underline">Sign in</Link>
      </p>
    </div>
  );
}
