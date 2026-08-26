import { describe, expect, it } from "vitest";

import { mergeSiteSettings } from "@/lib/marketing/cms/merge";
import { CMS_TAGS, newsPostTag, tagsFor } from "@/lib/marketing/cms/revalidate";
import { admissionsNoteFor, SITE } from "@/lib/marketing/site";
import {
  cmsGalleryListSchema,
  cmsDescribedImageSchema,
  cmsImageAssetSchema,
  cmsNewsListSchema,
  cmsSiteSettingsSchema,
} from "@/lib/validators/marketing";

/**
 * The fallback policy, pinned.
 *
 * This is the safety net for the whole Sanity integration: the school edits content in a Studio with no
 * staging environment, and these are the rules that decide what the public site does when they clear a
 * field, half-fill one, or when Sanity is unreachable. `mergeSiteSettings` is pure, so all of it is
 * testable with no network and no Sanity project.
 */

describe("mergeSiteSettings", () => {
  it("returns the shipped config untouched when Sanity is unconfigured or unreachable", () => {
    const merged = mergeSiteSettings(SITE, null);
    expect(merged).toEqual({ ...SITE, foundingStory: null });
  });

  it("returns the shipped config when the settings document does not exist yet", () => {
    // The realistic day-one state: project created, nobody has opened "Site settings".
    const parsed = cmsSiteSettingsSchema.parse({});
    const merged = mergeSiteSettings(SITE, parsed);
    expect(merged.contact).toEqual(SITE.contact);
    expect(merged.admissionsYear).toBe(SITE.admissionsYear);
    expect(merged.earlyBird).toBe(SITE.earlyBird);
    expect(merged.hours).toEqual(SITE.hours);
  });

  it("overrides only the fields that were filled in", () => {
    const merged = mergeSiteSettings(SITE, cmsSiteSettingsSchema.parse({ contactEmail: "office@slis.edu.gh" }));
    expect(merged.contact.email).toBe("office@slis.edu.gh");
    // Untouched neighbours must survive, an editor filling one box must not blank the rest.
    expect(merged.contact.phones).toEqual(SITE.contact.phones);
    expect(merged.earlyBird).toBe(SITE.earlyBird);
  });

  it("treats an empty or whitespace-only field as unset", () => {
    const merged = mergeSiteSettings(
      SITE,
      cmsSiteSettingsSchema.parse({ contactEmail: null, earlyBird: "   " }),
    );
    expect(merged.contact.email).toBe(SITE.contact.email);
    expect(merged.earlyBird).toBe(SITE.earlyBird);
  });

  it("falls back rather than rendering an empty list when an array is cleared", () => {
    const merged = mergeSiteSettings(SITE, cmsSiteSettingsSchema.parse({ phones: [], hoursEntries: [] }));
    expect(merged.contact.phones).toEqual(SITE.contact.phones);
    expect(merged.hours.entries).toEqual(SITE.hours.entries);
  });

  it("replaces an array wholesale instead of merging it element-wise", () => {
    // Element-wise merging is how you get "the editor deleted the second number and the third
    // inherited its value". Two supplied numbers must mean exactly two numbers.
    const merged = mergeSiteSettings(SITE, cmsSiteSettingsSchema.parse({ phones: ["0300000001", "0300000002"] }));
    expect(merged.contact.phones).toEqual(["0300000001", "0300000002"]);
    expect(SITE.contact.phones.length).toBe(2); // guard: the fixture would hide a bug if lengths differed
  });

  it("trims phone numbers and drops blank entries", () => {
    const merged = mergeSiteSettings(SITE, cmsSiteSettingsSchema.parse({ phones: [" 0300000001 ", "  "] }));
    expect(merged.contact.phones).toEqual(["0300000001"]);
  });

  it("derives the admissions note from whichever year won, so the two can never disagree", () => {
    const edited = mergeSiteSettings(SITE, cmsSiteSettingsSchema.parse({ admissionsYear: "2027/2028" }));
    expect(edited.admissionsYear).toBe("2027/2028");
    expect(edited.admissionsNote).toBe("Admission open for 2027/2028");

    const untouched = mergeSiteSettings(SITE, cmsSiteSettingsSchema.parse({}));
    expect(untouched.admissionsNote).toBe(admissionsNoteFor(SITE.admissionsYear));
  });

  it("ignores a malformed school year and keeps the shipped one", () => {
    // `.catch(null)` on the field means one bad value degrades that field, not the whole document.
    const merged = mergeSiteSettings(SITE, cmsSiteSettingsSchema.parse({ admissionsYear: "2026-2027" }));
    expect(merged.admissionsYear).toBe(SITE.admissionsYear);
    expect(merged.admissionsNote).toBe(admissionsNoteFor(SITE.admissionsYear));
  });

  it("keeps the About page's placeholder when no founding story has been written", () => {
    expect(mergeSiteSettings(SITE, cmsSiteSettingsSchema.parse({ foundingStory: [] })).foundingStory).toBeNull();
    expect(mergeSiteSettings(SITE, cmsSiteSettingsSchema.parse({})).foundingStory).toBeNull();
  });

  it("surfaces a founding story once one exists", () => {
    const story = [{ _type: "block", children: [{ _type: "span", text: "We opened in Oyarifa." }] }];
    const merged = mergeSiteSettings(SITE, cmsSiteSettingsSchema.parse({ foundingStory: story }));
    expect(merged.foundingStory).toHaveLength(1);
  });
});

describe("cmsSiteSettingsSchema", () => {
  it("rejects a value that is not an email and degrades that field only", () => {
    const parsed = cmsSiteSettingsSchema.parse({ contactEmail: "not-an-email", earlyBird: "A discount applies." });
    expect(parsed.contactEmail).toBeNull();
    expect(parsed.earlyBird).toBe("A discount applies.");
  });

  it("drops an hours list whose rows are incomplete", () => {
    expect(cmsSiteSettingsSchema.parse({ hoursEntries: [{ days: "Monday – Friday" }] }).hoursEntries).toBeNull();
  });
});

describe("image asset contracts", () => {
  const asset = {
    ref: "image-abc123-1920x1440-jpg",
    width: 1920,
    height: 1440,
    lqip: "data:image/jpeg;base64,abc",
  };

  it("accepts asset facts with no description attached", () => {
    // REGRESSION: the asset schema must not require `alt`. It used to, which meant the gallery
    // projection, where alt lives on the document, not the image, failed every single row, emptied
    // the list, and silently fell back to the committed photos. See cms/queries.ts ASSET_PROJECTION.
    expect(cmsImageAssetSchema.parse(asset)).toMatchObject({ width: 1920, height: 1440 });
    expect(cmsImageAssetSchema.safeParse({ ...asset, alt: undefined }).success).toBe(true);
  });

  it("accepts an asset with no LQIP", () => {
    const { lqip, ...noLqip } = asset;
    expect(lqip).toBeTypeOf("string");
    expect(cmsImageAssetSchema.parse(noLqip).lqip).toBeUndefined();
  });

  it("rejects an asset with no dimensions, which would cause layout shift", () => {
    const { width, ...noWidth } = asset;
    expect(width).toBe(1920);
    expect(cmsImageAssetSchema.safeParse(noWidth).success).toBe(false);
  });

  it("requires a description where one travels with the image (news covers, body images)", () => {
    const described = { ...asset, alt: "Children at the sports day on the school field" };
    expect(cmsDescribedImageSchema.parse(described).alt).toBe(described.alt);
    expect(cmsDescribedImageSchema.safeParse(asset).success).toBe(false);
    expect(cmsDescribedImageSchema.safeParse({ ...asset, alt: "" }).success).toBe(false);
  });
});

describe("list tolerance", () => {
  const photo = {
    id: "a",
    alt: "Children at the kids' funtime event around an inflatable pool",
    // Mirrors the real GROQ projection: asset facts only, no alt inside the image.
    image: { ref: "image-a-800x600-jpg", width: 800, height: 600, lqip: null },
  };

  it("drops one broken gallery row rather than the whole gallery", () => {
    const rows = cmsGalleryListSchema.parse([photo, { id: "b" }, photo]);
    expect(rows.filter(Boolean)).toHaveLength(2);
    expect(rows[1]).toBeNull();
  });

  it("drops one broken news row rather than emptying the news page", () => {
    const post = {
      id: "p1",
      title: "First term opens",
      slug: "first-term-opens",
      publishedAt: "2026-09-01T08:00:00Z",
      excerpt: "Our first term of the new school year opens on the first Monday of September.",
      coverImage: null,
    };
    const rows = cmsNewsListSchema.parse([post, { id: "p2", title: "Broken" }]);
    expect(rows.filter(Boolean)).toHaveLength(1);
  });

  it("keeps a post whose cover photo is malformed, minus the photo", () => {
    const parsed = cmsNewsListSchema.parse([
      {
        id: "p1",
        title: "Sports day",
        slug: "sports-day",
        publishedAt: "2026-06-01T08:00:00Z",
        excerpt: "Every class took part in this year's inter-house athletics on the school field.",
        coverImage: { ref: "image-x-0x0-jpg" },
      },
    ]);
    expect(parsed[0]).not.toBeNull();
    expect(parsed[0]?.coverImage).toBeNull();
  });
});

describe("tagsFor (publish webhook -> cache tags)", () => {
  // These strings must match the `tags` passed to each fetch in cms/read.ts. A mismatch does not
  // throw, a publish just never reaches the site, so it has to be a test, not a careful reading.
  it("expires both the collection and the individual post for a news publish", () => {
    expect(tagsFor({ _type: "newsPost", slug: "first-term-opens" })).toEqual([
      "newsPost",
      "newsPost:first-term-opens",
    ]);
  });

  it("falls back to the collection tag when the payload carries no slug", () => {
    expect(tagsFor({ _type: "newsPost" })).toEqual(["newsPost"]);
    expect(tagsFor({ _type: "newsPost", slug: null })).toEqual(["newsPost"]);
  });

  it("maps gallery and settings to their own tags", () => {
    expect(tagsFor({ _type: "galleryImage" })).toEqual(["galleryImage"]);
    expect(tagsFor({ _type: "siteSettings" })).toEqual(["siteSettings"]);
  });

  it("returns nothing for a type the site does not render", () => {
    // The route turns this into a 200 no-op, so Sanity does not retry it forever.
    expect(tagsFor({ _type: "someFutureType" })).toEqual([]);
    expect(tagsFor({})).toEqual([]);
  });

  it("keeps the tag vocabulary in one place", () => {
    expect(Object.values(CMS_TAGS)).toEqual(["siteSettings", "galleryImage", "newsPost"]);
    expect(newsPostTag("sports-day")).toBe("newsPost:sports-day");
  });
});
