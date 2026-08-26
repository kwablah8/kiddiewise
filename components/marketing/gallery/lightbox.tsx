"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { MediaAsset } from "@/lib/marketing/media";

interface LightboxProps {
  photos: readonly MediaAsset[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}

/**
 * Gallery lightbox, a focus-trapped modal over a near-black backdrop (so its reduced-opacity
 * caption text sits on near-black, not the royal-blue brand band; see the AA contrast note below).
 * Escape closes, ArrowLeft/ArrowRight step through photos, and a backdrop click closes. Follows
 * the same trap/restore-focus pattern as the mobile nav drawer (`site-header.tsx`).
 */
export function Lightbox({ photos, index, onClose, onNavigate }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const photo = photos[index];

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (photos.length > 1 && e.key === "ArrowRight") {
        e.preventDefault();
        onNavigate((index + 1) % photos.length);
        return;
      }
      if (photos.length > 1 && e.key === "ArrowLeft") {
        e.preventDefault();
        onNavigate((index - 1 + photos.length) % photos.length);
        return;
      }
      if (e.key !== "Tab") return;
      const panel = dialogRef.current;
      const focusables = panel
        ? panel.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          )
        : null;
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [index, photos, onClose, onNavigate]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-10">
      <button
        type="button"
        aria-label="Close gallery"
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 motion-reduce:animate-none"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Photo ${index + 1} of ${photos.length}: ${photo.alt}`}
        className="relative flex max-h-full w-full max-w-4xl flex-col items-center animate-in zoom-in-95 fade-in duration-200 motion-reduce:animate-none"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-14 right-0 flex size-11 items-center justify-center rounded-full bg-white/10 text-white outline-none transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <div className="relative flex max-h-[72svh] w-full items-center justify-center overflow-hidden rounded-2xl bg-black/30">
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            width={photo.width ?? 1920}
            height={photo.height ?? 1440}
            placeholder={photo.blurDataURL ? "blur" : "empty"}
            blurDataURL={photo.blurDataURL}
            sizes="90vw"
            priority
            className="max-h-[72svh] w-auto object-contain"
          />
        </div>

        {/* Solid white on near-black (bg-black/85 behind, bg-black/30 image well): well above 4.5:1. */}
        <p className="mt-5 max-w-xl text-center text-sm leading-relaxed text-white">{photo.alt}</p>
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">
          {index + 1} / {photos.length}
        </p>

        {photos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => onNavigate((index - 1 + photos.length) % photos.length)}
              aria-label="Previous photo"
              className="absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white outline-none transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:-left-6"
            >
              <ChevronLeft className="size-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate((index + 1) % photos.length)}
              aria-label="Next photo"
              className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white outline-none transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:-right-6"
            >
              <ChevronRight className="size-6" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
