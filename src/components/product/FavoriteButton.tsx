"use client";

import { useState, useTransition } from "react";
import { toggleFavoriteAction } from "@/lib/actions";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/I18nProvider";

export function FavoriteButton({
  styleId,
  initialFavorited,
  variant = "button",
}: {
  styleId: string;
  initialFavorited: boolean;
  /** "button" = labeled pill (product page); "icon" = bare icon (cards). */
  variant?: "button" | "icon";
}) {
  const { dict } = useI18n();
  const c = dict.catalog;
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !favorited;
    setFavorited(next); // optimistic
    startTransition(async () => {
      const result = await toggleFavoriteAction(styleId, favorited);
      if (result.error) setFavorited(!next); // revert on failure
    });
  }

  if (variant === "icon") {
    return (
      <IconButton
        variant="bordered"
        onClick={toggle}
        disabled={isPending}
        aria-pressed={favorited}
        aria-label={favorited ? c.removeFromFavorites : c.addToFavorites}
        className="bg-white/90 backdrop-blur"
      >
        <HeartIcon filled={favorited} />
      </IconButton>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={favorited}
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center border transition-colors sm:w-auto sm:gap-2 sm:px-4",
        favorited ? "border-ink bg-ink text-white" : "border-stone-300 text-ink hover:border-ink",
      )}
    >
      <HeartIcon filled={favorited} />
      <span className="hidden text-xs font-semibold uppercase tracking-wide sm:inline">
        {favorited ? c.saved : c.save}
      </span>
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.5s-7.5-4.6-10-9.3C.6 8.1 2 4.5 5.4 4A5 5 0 0 1 12 6.5 5 5 0 0 1 18.6 4c3.4.5 4.8 4.1 3.4 7.2-2.5 4.7-10 9.3-10 9.3Z"
      />
    </svg>
  );
}
