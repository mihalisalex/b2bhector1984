"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { StyleImage } from "@/lib/data/styleImages";

export function ProductGallery({
  images,
  styleName,
  styleNumber,
  className,
}: {
  images: StyleImage[];
  styleName: string;
  styleNumber?: string;
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const active = images[activeIndex];

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setActiveIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setActiveIndex((i) => (i - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, images.length]);

  if (!active) return null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-stone-200"
      >
        <Image
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

      {images.length > 1 && (
        <div className="mt-2 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative aspect-square overflow-hidden bg-stone-200 outline-offset-2",
                i === activeIndex ? "ring-2 ring-ink" : "opacity-70 hover:opacity-100",
              )}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
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
          aria-label={`${styleName} photo ${activeIndex + 1} of ${images.length}`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-5 top-5 text-3xl leading-none text-white/80 hover:text-white"
            aria-label="Close"
          >
            &times;
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i - 1 + images.length) % images.length);
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
                  setActiveIndex((i) => (i + 1) % images.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-6 text-3xl text-white/80 hover:text-white"
                aria-label="Next photo"
              >
                &rsaquo;
              </button>
            </>
          )}

          <div
            className="relative h-[80vh] w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={active.publicUrl}
              alt={active.altText || styleName}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
