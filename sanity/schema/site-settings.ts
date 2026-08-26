import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * The handful of marketing facts the school revises on its own schedule.
 *
 * Deliberately not here: the school's name, motto and crest (they live in `lib/brand.ts`, shared with
 * the portal and the generated PDF report cards, if Sanity owned them the public site and the portal
 * could disagree), the campus address (rendered by a client component and by the sign-in screen), the
 * tagline, the programs, and every piece of section prose. Changing those is a design decision, not a
 * content update, so they stay in `lib/marketing/site.ts`.
 *
 * Also deliberately absent: the "Admission open for 2026/2027" line. It is derived from
 * `admissionsYear` in code, exactly as it is today, so the editor types the year once.
 *
 * Every field here is optional as far as the site is concerned: `lib/marketing/cms/merge.ts` falls
 * back to the committed value for anything left empty. The `required()` rules below exist to stop an
 * editor half-filling a field, not because the page needs them.
 */
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "contact", title: "Contact", default: true },
    { name: "admissions", title: "Admissions" },
    { name: "story", title: "Our story" },
  ],
  fields: [
    defineField({
      name: "contactEmail",
      title: "Email address",
      description: "Shown on the contact page, the admissions page and in the footer.",
      type: "string",
      group: "contact",
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: "phones",
      title: "Phone numbers",
      description:
        "The first number is treated as the primary one. Add a second only if the school really answers it.",
      type: "array",
      group: "contact",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: "hoursEntries",
      title: "Opening hours",
      description: "One row per group of days, in the order you want them listed.",
      type: "array",
      group: "contact",
      of: [
        defineArrayMember({
          type: "object",
          name: "hoursEntry",
          fields: [
            defineField({
              name: "days",
              title: "Days",
              description: 'For example "Monday – Friday".',
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "time",
              title: "Times",
              description: 'For example "6:00am – 8:00pm".',
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "days", subtitle: "time" } },
        }),
      ],
    }),
    defineField({
      name: "hoursNote",
      title: "Note below the opening hours",
      description: "Optional. One short sentence, e.g. who the weekend drop-off service is open to.",
      type: "text",
      rows: 2,
      group: "contact",
    }),
    defineField({
      name: "admissionsYear",
      title: "School year admissions are open for",
      description:
        'Type it exactly like this: 2026/2027. This one field updates the home page, the admissions page, the flyer block, the footer and the page titles.',
      type: "string",
      group: "admissions",
      validation: (rule) =>
        rule
          .required()
          .regex(/^\d{4}\/\d{4}$/, { name: "school year (e.g. 2026/2027)" }),
    }),
    defineField({
      name: "earlyBird",
      title: "Early-bird discount sentence",
      description:
        "One standalone sentence. Only say what is actually true — if there is no amount or deadline confirmed, do not invent one.",
      type: "text",
      rows: 2,
      group: "admissions",
    }),
    // no `socials` field, deliberately. `SITE.socials` exists in the config interface but NOTHING
    // renders it: the footer has no social row and `SOCIAL_LINKS` in `components/marketing/
    // nav-config.ts` is imported nowhere. A Studio field that visibly does nothing after an editor
    // fills it in is worse than an absent one; it teaches the school not to trust the CMS. Add this
    // field in the same change that builds the footer row, not before.
    defineField({
      name: "foundingStory",
      title: "Our story",
      description:
        "Optional. Fills the placeholder on the About page. Say how and why the school started — only what is true.",
      type: "array",
      group: "story",
      of: [defineArrayMember({ type: "block", styles: [{ title: "Normal", value: "normal" }] })],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site settings" }),
  },
});
