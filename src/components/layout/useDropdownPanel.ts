import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Shared portal-dropdown mechanics (open state, viewport position, outside-click/Escape
 * dismissal) — the same behavior `AccountMenu.tsx` hand-rolls, factored out for
 * `LanguageSwitcher` so it doesn't duplicate it. Position is measured from the trigger
 * button (not inherited via CSS) because the header clips overflow for its oversized
 * watermark, so callers must render their panel through a portal to `document.body`, same
 * as `AccountMenu`.
 */
export function useDropdownPanel<TButton extends HTMLElement, TPanel extends HTMLElement>() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<TButton>(null);
  const panelRef = useRef<TPanel>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = buttonRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return { open, setOpen, mounted, pos, buttonRef, panelRef };
}
