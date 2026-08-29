import { defineField, defineType } from "sanity";

/**
 * One photo in the public gallery.
 *
 * `alt` is required, not optional. Every photo in the committed manifest (`lib/marketing/media.ts`)
 * carries a real description of what it shows, not "photo1.jpg", and the gallery must not regress
 * on that the moment uploads move into the Studio.
 *
 * `order` is optional on purpose. An editor who ignores it gets newest-first, which is the behaviour
 * they expect after uploading this term's event photos. Numbering only matters if the school later
 * wants a specific photo to lead.
 */
export const galleryImage = defineType({
  name: "galleryImage",
  title: "Gallery photo",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "alt",
      title: "Photo description",
      description:
        "Describe what is in the photo, for parents using a screen reader. For example: “Children and staff at the kids' funtime event around an inflatable pool.”",
      type: "string",
      validation: (rule) => rule.required().min(10),
    }),
    // Named `position` rather than `order` on purpose: `order` is the GROQ ordering function, and a
    // field of that name has to be escaped as `@.order` in every query that sorts by it. Not worth
    // the trap for a synonym.
    defineField({
      name: "position",
      title: "Position",
      description:
        "Optional. Leave blank and photos appear newest first. Set a number to pin a photo earlier — 1 shows first.",
      type: "number",
      validation: (rule) => rule.min(1).integer(),
    }),
  ],
  orderings: [
    {
      title: "Gallery order",
      name: "galleryOrder",
      by: [
        { field: "position", direction: "asc" },
        { field: "_createdAt", direction: "desc" },
      ],
    },
  ],
  preview: {
    select: { title: "alt", subtitle: "position", media: "image" },
    prepare: ({ title, subtitle, media }) => ({
      title: typeof title === "string" ? title : "Untitled photo",
      subtitle: typeof subtitle === "number" ? `Position ${subtitle}` : undefined,
      media,
    }),
  },
});
