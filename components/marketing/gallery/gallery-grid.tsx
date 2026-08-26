"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";

import type { MediaAsset } from "@/lib/marketing/media";
import { Lightbox } from "@/components/marketing/gallery/lightbox";

interface GalleryGridProps {
  /**
   * Photos to show, already resolved. Comes from `getGalleryPhotos()`, the school's Studio uploads
   * when there are any, otherwise the committed set in `MEDIA.gallery`. Passed as a prop rather than
   * imported because this is a client component and the read is server-side.
   */
  photos: readonly MediaAsset[];
}

/**
 * A CSS-columns masonry grid: each photo keeps its real, mixed aspect ratio (landscape campus
 * shots beside portrait classroom shots) instead of being cropped into uniform tiles. Clicking
 * (or pressing Enter/Space on) any photo opens it in the `Lightbox`.
 */
export function GalleryGrid({ photos }: GalleryGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`Enlarge photo: ${photo.alt}`}
            className={`reveal${i > 0 ? ` d${Math.min(i % 3, 3)}` : ""} group relative mb-5 block w-full break-inside-avoid overflow-hidden rounded-3xl bg-[var(--m-warm)] shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none ring-1 ring-black/[0.06] transition-shadow duration-200 hover:shadow-[0_18px_40px_-20px_rgba(16,24,40,0.3)] focus-visible:ring-2 focus-visible:ring-[var(--m-brand)] focus-visible:ring-offset-2`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width ?? 1920}
              height={photo.height ?? 1440}
              // Sanity uploads carry an LQIP; the committed files do not and get Next's build-time
              // placeholder instead, so this switch is per-photo rather than per-gallery.
              placeholder={photo.blurDataURL ? "blur" : "empty"}
              blurDataURL={photo.blurDataURL}
              sizes="(min-width: 1024px) 32vw, (min-width: 640px) 46vw, 92vw"
              className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-[background-color,opacity] duration-200 group-hover:bg-black/25 group-hover:opacity-100 group-focus-visible:bg-black/25 group-focus-visible:opacity-100 motion-reduce:transition-none">
              <span className="flex size-11 items-center justify-center rounded-full bg-white/95 text-[var(--m-brand)] shadow-md">
                <ZoomIn className="size-5" aria-hidden="true" />
              </span>
            </span>
          </button>
        ))}
      </div>

      {openIndex !== null ? (
        <Lightbox
          photos={photos}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={(next) => setOpenIndex(next)}
        />
      ) : null}
    </>
  );
}
