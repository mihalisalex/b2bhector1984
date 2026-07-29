import { listAuditEntriesPage } from "@/lib/data/auditLog";
import { getAccountById } from "@/lib/data/accounts";
import { formatDate } from "@/lib/format";
import { AuditLogFilterBar } from "@/components/admin/AuditLogFilterBar";
import { Pagination } from "@/components/admin/products/Pagination";

export const metadata = { title: "Audit Log", robots: { index: false, follow: false } };

const PAGE_SIZE = 50;

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminAuditLogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Number(firstParam(sp, "page") ?? "1") || 1;
  const q = firstParam(sp, "q");

  const { entries, total } = await listAuditEntriesPage(page, PAGE_SIZE, q);

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

      <AuditLogFilterBar />

      {entries.length === 0 ? (
        <div className="mt-6 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          {q ? `No admin actions match "${q}".` : "No admin actions logged yet."}
        </div>
      ) : (
        <>
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
          <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
        </>
      )}
    </div>
  );
}
