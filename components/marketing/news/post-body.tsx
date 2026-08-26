import Image from "next/image";
import { PortableText, type PortableTextComponents } from "next-sanity";

import { toMediaAsset } from "@/lib/marketing/cms/image";
import {
  cmsDescribedImageSchema,
  type PortableText as PortableTextValue,
} from "@/lib/validators/marketing";

/**
 * Renders a news post's rich text.
 *
 * The components map is not optional decoration: without it, Portable Text emits unstyled output and
 * every heading, list and link in a post that the school wrote looks broken. The set of styles here
 * matches exactly what `sanity/schema/news-post.ts` offers the editor, so there is no block type they
 * can produce that lands unstyled.
 *
 * Typography follows the article's reading measure rather than the marketing page rhythm: this is body
 * copy someone reads end to end, not a scannable landing section.
 */
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mt-5 leading-[1.75] text-[var(--text)] first:mt-0">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mt-12 text-[clamp(1.4rem,2.4vw,1.75rem)] font-semibold leading-tight tracking-[-0.015em] text-balance text-[var(--text)] first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-9 text-lg font-semibold tracking-[-0.01em] text-[var(--text)] first:mt-0">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-7 border-l-2 border-[var(--m-accent)] pl-5 text-lg leading-relaxed text-[var(--muted-foreground)] italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-5 list-disc space-y-2 pl-6 leading-[1.75] text-[var(--text)]">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mt-5 list-decimal space-y-2 pl-6 leading-[1.75] text-[var(--text)]">
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ children, value }) => {
      const href = typeof value?.href === "string" ? value.href : undefined;
      if (!href) return <>{children}</>;
      // Anything an editor links to is somewhere else, so it opens in a new tab, and `noopener`
      // is what stops that tab from reaching back into `window.opener`.
      const external = /^https?:\/\//i.test(href);
      return (
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="rounded font-medium text-[var(--m-brand)] underline decoration-[var(--m-accent)] decoration-2 underline-offset-[3px] outline-none transition-colors hover:text-[var(--m-brand-deep)] focus-visible:ring-2 focus-visible:ring-[var(--m-brand)] focus-visible:ring-offset-2"
        >
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }) => {
      // The GROQ projection flattens image blocks to the same five keys as a cover photo, so the same
      // contract validates them. A block that fails is skipped rather than crashing the article, a
      // missing photo is a worse-looking post, not a broken page.
      const parsed = cmsDescribedImageSchema.safeParse(value);
      if (!parsed.success) return null;
      const asset = toMediaAsset(parsed.data, parsed.data.alt);
      if (!asset) return null;

      return (
        <figure className="mt-9">
          <Image
            src={asset.src}
            alt={asset.alt}
            width={asset.width ?? 1600}
            height={asset.height ?? 1200}
            placeholder={asset.blurDataURL ? "blur" : "empty"}
            blurDataURL={asset.blurDataURL}
            sizes="(min-width: 768px) 42rem, 92vw"
            className="h-auto w-full rounded-2xl ring-1 ring-black/[0.06]"
          />
        </figure>
      );
    },
  },
};

export function PostBody({ value }: { value: PortableTextValue }) {
  return <PortableText value={value} components={components} />;
}
