import { listApplications } from "@/lib/data/applications";
import { AdminApplicationsList } from "@/components/admin/AdminApplicationsList";
import { ApplicationsCsvExportButton } from "@/components/admin/ApplicationsCsvExportButton";

export const metadata = { title: "Applications" };

export default async function AdminApplicationsPage() {
  const applications = await listApplications();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 pb-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
          Applications
        </h1>
        <ApplicationsCsvExportButton applications={applications} />
      </div>

      {applications.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          No applications yet.
        </div>
      ) : (
        <div className="mt-6">
          <AdminApplicationsList applications={applications} />
        </div>
      )}
    </div>
  );
}
