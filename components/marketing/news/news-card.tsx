import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { formatDate } from "@/lib/format";
import type { NewsSummary } from "@/lib/marketing/news";

interface NewsCardProps {
  post: NewsSummary;
  /** Position in the list — drives the `reveal` entrance stagger, matching the programs grid. */
  index: number;
}

/**
 * One post in the `/news` grid.
 *
 * Follows the programs-card contract deliberately: the hover lift lives on an inner element rather
 * than on the `.reveal` article, because a CSS Animation (the entrance) and a CSS Transition (the
 * hover) fighting over `transform` on one element lets the still-active view()-timeline animation win
 * permanently and silently kills the lift. See `components/marketing/home/programs.tsx`.
 *
 * A post with no cover photo gets a gold rule and extra breathing room instead of an empty grey box —
 * the excerpt is doing the work in that case, so it is given the space.
 */
export function NewsCard({ post, index }: NewsCardProps) {
  return (
    <article className={`reveal${index > 0 ? ` d${Math.min(index, 4)}` : ""}`}>
      <div className="group h-full">
        <Link
          href={`/news/${post.slug}`}
          className="flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--m-canvas)] shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-[transform,box-shadow] duration-200 hover:-translate-y-1.5 hover:shadow-[0_20px_44px_-20px_rgba(16,24,40,0.28)] focus-visible:ring-2 focus-visible:ring-[var(--m-brand)] focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          {post.cover ? (
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={post.cover.src}
                alt={post.cover.alt}
                fill
                placeholder={post.cover.blurDataURL ? "blur" : "empty"}
                blurDataURL={post.cover.blurDataURL}
                sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </div>
          ) : (
            <span aria-hidden="true" className="block h-1.5 w-full bg-[var(--m-accent)]" />
          )}

          <div className="flex flex-1 flex-col p-7">
            <time
              dateTime={post.publishedAt}
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--m-brand)]"
            >
              {formatDate(post.publishedAt)}
            </time>
            <h3 className="mt-3 text-xl font-semibold leading-snug tracking-[-0.01em] text-balance text-[var(--text)]">
              {post.title}
            </h3>
            <p className="mt-3 flex-1 leading-relaxed text-[var(--muted-foreground)]">
              {post.excerpt}
            </p>
            <span className="mt-6 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--m-brand)]">
              Read more
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                aria-hidden="true"
              />
            </span>
          </div>
        </Link>
      </div>
    </article>
  );
}
