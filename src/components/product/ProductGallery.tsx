"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { useColorwaySelection } from "@/lib/colorway-selection-context";
import type { StyleImage } from "@/lib/data/styleImages";
import type { Colorway } from "@/lib/types";

export function ProductGallery({
  images,
  styleName,
  styleNumber,
  colorways,
  className,
}: {
  images: StyleImage[];
  styleName: string;
  styleNumber?: string;
  /** When an uploaded photo is tagged to a specific colorway (admin's Media tab), selecting
   * that colorway elsewhere on the page swaps the gallery to that real photo. Untagged
   * photos are treated as generic and stay visible regardless of the selection. */
  colorways?: Colorway[];
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const mainButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);
  /** Set when a touch resolves as a swipe, so the trailing click doesn't also open the lightbox. */
  const swipedRef = useRef(false);

  const hasMultipleColorways = (colorways?.length ?? 0) > 1;
  // The product page always wraps this in a ColorwaySelectionProvider.
  const { colorwayId } = useColorwaySelection();

  // Only hide photos tagged to a *different* colorway — untagged (generic) photos always
  // show, so a style with no per-colorway photography behaves exactly as before. Falls
  // back to the full set if a colorway has neither a dedicated nor a generic photo,
  // rather than rendering an empty gallery.
  const visibleImages = useMemo(() => {
    if (!hasMultipleColorways) return images;
    const filtered = images.filter((img) => !img.colorwayId || img.colorwayId === colorwayId);
    return filtered.length > 0 ? filtered : images;
  }, [images, colorwayId, hasMultipleColorways]);

  // When the selection changes, jump to a photo actually tagged to that colorway if one
  // exists, rather than leaving the buyer on whatever index they were previously viewing.
  useEffect(() => {
    if (!hasMultipleColorways) return;
    const taggedIndex = visibleImages.findIndex((img) => img.colorwayId === colorwayId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- responding to the shared colorway selection changing, not derived render state
    setActiveIndex(taggedIndex >= 0 ? taggedIndex : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the colorway selection itself should retrigger this jump
  }, [colorwayId]);

  const active = visibleImages[Math.min(activeIndex, visibleImages.length - 1)];

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setActiveIndex((i) => (i + 1) % visibleImages.length);
      if (e.key === "ArrowLeft") setActiveIndex((i) => (i - 1 + visibleImages.length) % visibleImages.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, visibleImages.length]);

  // Move focus into the dialog on open, and back to the trigger on close —
  // guarded so this doesn't fire on initial mount (lightboxOpen starts false).
  useEffect(() => {
    if (lightboxOpen) {
      wasOpenRef.current = true;
      closeButtonRef.current?.focus();
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      mainButtonRef.current?.focus();
    }
  }, [lightboxOpen]);

  // Zoom is per-photo — carrying a zoom (and its origin) across a photo change or a
  // close/reopen would land the next image arbitrarily cropped.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting a view-only affordance when the thing it applies to changes
    setZoom(null);
  }, [activeIndex, lightboxOpen]);

  function goTo(delta: number) {
    setActiveIndex((i) => (i + delta + visibleImages.length) % visibleImages.length);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartXRef.current = e.changedTouches[0]?.clientX ?? null;
    swipedRef.current = false;
  }

  /** Horizontal swipe changes photo; anything under the threshold stays a tap. */
  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStartXRef.current;
    touchStartXRef.current = null;
    if (start == null || visibleImages.length < 2) return;
    const dx = (e.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(dx) < 40) return;
    swipedRef.current = true;
    goTo(dx < 0 ? 1 : -1);
  }

  if (!active) return null;

  const selectedColorwayName = hasMultipleColorways ? colorways!.find((c) => c.id === colorwayId)?.name : undefined;
  const showingTaggedPhoto = active.colorwayId === colorwayId;

  return (
    <div className={className}>
      {/* Full-bleed below lg — breaking out of the page's own side padding is what makes
          the photo read as large rather than inset in a box. Reverts at lg, where the
          product page has already capped/centered its own column, so there's nothing left
          to break out of; thumbnails/caption below stay padded so they align with the
          page's text instead of also running edge to edge. The 3:4 aspect ratio itself is
          unconditional — the product view is the same layout at every screen size. */}
      <div className="-mx-6 lg:mx-0">
        <button
          ref={mainButtonRef}
          type="button"
          onClick={() => {
            if (swipedRef.current) {
              swipedRef.current = false;
              return;
            }
            setLightboxOpen(true);
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          aria-label={`${styleName} — photo ${activeIndex + 1} of ${visibleImages.length}. Open full screen.`}
          className="relative block aspect-[3/4] w-full touch-pan-y overflow-hidden bg-stone-100"
        >
          <Image
            key={active.id}
            src={active.publicUrl}
            alt={active.altText || styleName}
            fill
            sizes="(min-width: 1024px) 440px, 100vw"
            className="object-cover"
            priority={activeIndex === 0}
          />
          {styleNumber && (
            <span className="font-mono-tab absolute bottom-2 right-2 bg-ink/80 px-1.5 py-0.5 text-[10px] tracking-wide text-white">
              {styleNumber}
            </span>
          )}
        </button>
      </div>

      {hasMultipleColorways && !showingTaggedPhoto && (
        <p className="mt-1.5 px-6 text-[11px] text-ink-soft lg:px-0">
          No dedicated photo uploaded yet for <span className="font-medium text-ink">{selectedColorwayName}</span> —
          showing another available photo.
        </p>
      )}

      {visibleImages.length > 1 && (
        <div className="mt-2 grid grid-cols-5 gap-2 px-6 lg:px-0">
          {visibleImages.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative aspect-square overflow-hidden bg-stone-200 outline-offset-2",
                i === activeIndex ? "ring-2 ring-ink" : "opacity-70 hover:opacity-100",
              )}
              aria-label={`Show photo ${i + 1} of ${visibleImages.length}`}
            >
              <Image
                src={img.publicUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${styleName} photo ${activeIndex + 1} of ${visibleImages.length}`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-5 top-5 text-3xl leading-none text-white/80 hover:text-white"
            aria-label="Close"
          >
            &times;
          </button>

          {visibleImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i - 1 + visibleImages.length) % visibleImages.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 px-3 py-6 text-3xl text-white/80 hover:text-white"
                aria-label="Previous photo"
              >
                &lsaquo;
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i + 1) % visibleImages.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-6 text-3xl text-white/80 hover:text-white"
                aria-label="Next photo"
              >
                &rsaquo;
              </button>
            </>
          )}

          {/* Click-to-zoom: origin follows the click point so the detail you aimed at is
              what fills the frame. Click again (or change photo) to zoom back out. */}
          <div
            className="relative h-[80vh] w-full max-w-4xl overflow-hidden"
            onClick={(e) => {
              e.stopPropagation();
              if (swipedRef.current) {
                swipedRef.current = false;
                return;
              }
              if (zoom) {
                setZoom(null);
                return;
              }
              const rect = e.currentTarget.getBoundingClientRect();
              setZoom({
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
              });
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="button"
            tabIndex={0}
            aria-label={zoom ? "Zoom out" : "Zoom in"}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setZoom((z) => (z ? null : { x: 50, y: 50 }));
              }
            }}
          >
            <Image
              src={active.publicUrl}
              alt={active.altText || styleName}
              fill
              sizes="90vw"
              className={cn(
                // `transition` (not `transition-transform`): Tailwind v4 emits zoom as the
                // standalone `scale` property, which transform-only transitions don't cover.
                "object-contain transition duration-200",
                zoom ? "scale-[2.2] cursor-zoom-out" : "cursor-zoom-in",
              )}
              style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
