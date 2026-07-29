"use client";

/** Client-local pagination for lists that are already fetched in full and filtered/paginated
 * in the browser (small admin reference tables — accounts, suppliers, sales reps). For a list
 * that should be paginated server-side instead, see the Products module's own Pagination. */
export function ListPager({
  page,
  pageCount,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-300 pt-4 text-sm text-ink-soft">
      <span>
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide hover:border-ink disabled:opacity-40 disabled:hover:border-stone-300"
        >
          Previous
        </button>
        <span className="font-mono-tab text-xs">
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
          className="border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide hover:border-ink disabled:opacity-40 disabled:hover:border-stone-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}
