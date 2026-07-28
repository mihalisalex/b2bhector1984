"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function Pagination({ total, page, pageSize }: { total: number; page: number; pageSize: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  if (pageCount <= 1) return null;

  const goTo = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-300 pt-4 text-sm text-ink-soft">
      <span>
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
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
          onClick={() => goTo(page + 1)}
          className="border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide hover:border-ink disabled:opacity-40 disabled:hover:border-stone-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}
