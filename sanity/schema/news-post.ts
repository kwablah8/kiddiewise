import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * A public news post: term dates, event write-ups, notices for prospective parents.
 *
 * This is not the portal's `announcements` table. That one is admin-authored, tenant-scoped by RLS and
 * read by parents and teachers who are signed in. This is outward-facing, written in the school's
 * marketing voice, indexed by search engines, and readable by anyone. Different audiences, no sync,
 * no duplicated fact.
 */
export const newsPost = defineType({
  name: "newsPost",
  title: "News post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Headline",
      type: "string",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "Web address",
      description:
        'This becomes the link, e.g. /news/first-term-opens. Press "Generate" to make it from the headline. Avoid changing it after publishing — old links stop working.',
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Date",
      description: "Posts are listed newest first.",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Summary",
      description:
        "One or two sentences. Shown on the news list and used as the page's description in Google and WhatsApp previews.",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().min(40).max(200),
    }),
    defineField({
      name: "coverImage",
      title: "Cover photo",
      description: "Optional, but a post with a photo travels much better when shared.",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Photo description",
          description:
            "Describe what is in the photo, for parents using a screen reader and for search engines. Not a caption.",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: "body",
      title: "The post",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          // A deliberately short list. Headings below H4 and exotic block styles have nowhere to land
          // in the article layout, and offering them invites a post that fights the design.
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Heading", value: "h2" },
            { title: "Subheading", value: "h3" },
            { title: "Quote", value: "blockquote" },
          ],
          lists: [
            { title: "Bulleted", value: "bullet" },
            { title: "Numbered", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
            ],
            annotations: [
              {
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  defineField({
                    name: "href",
                    title: "Link",
                    type: "url",
                    validation: (rule) => rule.required(),
                  }),
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: "image",
          title: "Photo",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Photo description",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", date: "publishedAt", media: "coverImage" },
    prepare: ({ title, date, media }) => ({
      title,
      subtitle:
        typeof date === "string"
          ? new Date(date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "No date",
      media,
    }),
  },
});
