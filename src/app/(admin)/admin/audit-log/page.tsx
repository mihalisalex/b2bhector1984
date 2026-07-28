import { listRecentAuditEntries } from "@/lib/data/auditLog";
import { getAccountById } from "@/lib/data/accounts";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Audit Log", robots: { index: false, follow: false } };

export default async function AdminAuditLogPage() {
  const entries = await listRecentAuditEntries(200);

  const actorIds = Array.from(new Set(entries.map((e) => e.actorAccountId).filter((id): id is string => !!id)));
  const actorEntries = await Promise.all(actorIds.map(async (id) => [id, await getAccountById(id)] as const));
  const actorNameById = new Map(actorEntries.map(([id, account]) => [id, account?.contactName ?? id]));

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Audit Log
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-soft">
        Every admin-initiated order, account, application, and sales-rep change, most recent first.
      </p>

      {entries.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          No admin actions logged yet.
        </div>
      ) : (
        <div className="scroll-thin mt-6 overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                <th className="px-3 py-2.5 font-semibold">When</th>
                <th className="px-3 py-2.5 font-semibold">Actor</th>
                <th className="px-3 py-2.5 font-semibold">Action</th>
                <th className="px-3 py-2.5 font-semibold">Target</th>
                <th className="px-3 py-2.5 font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-stone-200 last:border-b-0">
                  <td className="font-mono-tab whitespace-nowrap px-3 py-2 text-xs text-ink-soft">
                    {formatDate(entry.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-ink-soft">
                    {entry.actorAccountId ? (actorNameById.get(entry.actorAccountId) ?? entry.actorAccountId) : "—"}
                  </td>
                  <td className="font-mono-tab px-3 py-2 text-ink">{entry.action}</td>
                  <td className="font-mono-tab px-3 py-2 text-ink-soft">{entry.targetType} · {entry.targetId}</td>
                  <td className="px-3 py-2 text-ink-soft">{entry.detail ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
