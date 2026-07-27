import { listApplications } from "@/lib/data/applications";
import { approveApplication, declineApplication } from "@/lib/adminActions";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

const STATUS_STYLE: Record<string, string> = {
  pending: "border-court/40 bg-court-100 text-ink",
  approved: "border-positive/40 bg-positive-100 text-positive",
  active: "border-signal/40 bg-signal-100 text-signal",
  declined: "border-ember/40 bg-ember-100 text-ember",
};

export default async function AdminApplicationsPage() {
  const applications = await listApplications();

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Applications
      </h1>

      {applications.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          No applications yet.
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {applications.map((app) => (
            <div key={app.id} className="flex flex-wrap items-center justify-between gap-4 border border-stone-300 bg-white p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{app.businessName}</p>
                  <span className={cn("border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", STATUS_STYLE[app.status])}>
                    {app.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {app.contactName} · {app.email} · {app.storeLocation} · Submitted {formatDate(app.submittedAt)}
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {app.businessType} · {app.expectedVolume} · Resale cert {app.resaleCertId}
                </p>
              </div>
              {app.status === "pending" && (
                <div className="flex shrink-0 items-center gap-2">
                  <form action={approveApplication.bind(null, app.id)}>
                    <button
                      type="submit"
                      className="border border-ink bg-ink px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={declineApplication.bind(null, app.id)}>
                    <button
                      type="submit"
                      className="border border-stone-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft hover:border-ember hover:text-ember"
                    >
                      Decline
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
