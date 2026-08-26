import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Section } from "@/components/marketing/section";
import { CtaButton } from "@/components/marketing/cta-button";
import { PostBody } from "@/components/marketing/news/post-body";
import { formatDate } from "@/lib/format";
import { getNewsPost, getNewsSlugs } from "@/lib/marketing/cms/read";

interface NewsPostPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Prerenders every post that exists at build time. Returns `[]` when Sanity is unconfigured, a
 * supported build (CI, a developer without credentials); the routes simply render on demand instead.
 * Posts published AFTER a deploy are also covered: Next renders them on first request.
 */
export async function generateStaticParams() {
  const slugs = await getNewsSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: NewsPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsPost(slug);
  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    // The excerpt is required in the Studio precisely so this is never empty, and so a shared link on
    // WhatsApp, how most parents will actually receive it, shows a real summary and a real photo.
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      ...(post.cover ? { images: [{ url: post.cover.src, alt: post.cover.alt }] } : {}),
    },
  };
}

export default async function NewsPostPage({ params }: NewsPostPageProps) {
  const { slug } = await params;
  const post = await getNewsPost(slug);
  if (!post) notFound();

  return (
    <>
      <Section
        tone="brand"
        aria-labelledby="post-title"
        className="overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20"
        containerClassName="max-w-3xl"
      >
        <div className="relative reveal">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 rounded-md font-mono text-[11px] uppercase tracking-[0.18em] text-white outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            All news
          </Link>
          <h1
            id="post-title"
            className="mt-6 text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-balance text-white"
          >
            {post.title}
          </h1>
          <time
            dateTime={post.publishedAt}
            className="mt-5 block font-mono text-[11px] uppercase tracking-[0.18em] text-white/75"
          >
            {formatDate(post.publishedAt)}
          </time>
        </div>
      </Section>

      <Section tone="white" containerClassName="max-w-3xl">
        {post.cover ? (
          <Image
            src={post.cover.src}
            alt={post.cover.alt}
            width={post.cover.width ?? 1600}
            height={post.cover.height ?? 900}
            placeholder={post.cover.blurDataURL ? "blur" : "empty"}
            blurDataURL={post.cover.blurDataURL}
            sizes="(min-width: 768px) 48rem, 92vw"
            priority
            className="mb-12 h-auto w-full rounded-3xl ring-1 ring-black/[0.06]"
          />
        ) : null}

        <div className="text-lg">
          <PostBody value={post.body} />
        </div>

        <div className="mt-16 border-t border-[var(--border)] pt-10">
          <CtaButton href="/news" variant="outline-dark" size="lg">
            Back to all news
          </CtaButton>
        </div>
      </Section>
    </>
  );
}
