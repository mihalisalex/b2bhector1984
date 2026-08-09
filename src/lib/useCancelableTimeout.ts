"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * `setTimeout` whose pending timer is always cancelled when the component unmounts
 * (and whenever a new one is scheduled).
 *
 * Every call site of this previously used a bare `setTimeout(...)` with no handle kept,
 * which leaves a timer running against an unmounted component. Two of them
 * (`ReorderButton`, `LoadAssortmentButton`) called `router.push("/cart")` on a 350ms
 * delay, so a buyer who pressed Reorder and then navigated somewhere else within that
 * window got yanked to the cart from whatever page they had just opened — a real,
 * reproducible bug, not just a tidiness concern. The rest only flipped a local "just
 * added / copied" flag back off, which React 19 no-ops after unmount, but they leak a
 * live timer either way.
 *
 * Returns a `schedule(fn, ms)` with the same semantics as `setTimeout` for the caller.
 */
export function useCancelableTimeout() {
  const ref = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(ref.current), []);

  return useCallback((fn: () => void, ms: number) => {
    clearTimeout(ref.current);
    ref.current = setTimeout(fn, ms);
  }, []);
}
