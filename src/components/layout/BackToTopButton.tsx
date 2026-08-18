"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const SHOW_AFTER_PX = 480;

/** Minimal floating control that fades in once the reader has scrolled past the fold and
 * smooth-scrolls back to the top on click. Kept separate from IconButton (its closest cousin,
 * the "bordered" recipe) since this one is fixed-positioned and visibility-driven rather than
 * a plain inline trigger. Rendered once in the root layout, sits above page content. */
export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-stone-50/90 text-ink shadow-sm backdrop-blur transition-all duration-300 ease-out hover:border-ink hover:text-signal",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V6M6 11l6-6 6 6" />
      </svg>
    </button>
  );
}
