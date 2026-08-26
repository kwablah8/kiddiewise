import type { StructureResolver } from "sanity/structure";

/**
 * The Studio sidebar, written for the person who will actually use it.
 *
 * Sanity's default is a flat list of every document type, which for a non-technical editor reads as
 * three pieces of jargon. This replaces it with the three things the school does: change a detail,
 * write a post, add photos. `siteSettings` opens straight into the document, a list containing one
 * item is a click that teaches nothing.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(
          S.document()
            .schemaType("siteSettings")
            // A fixed id is what makes this a singleton: every editor opens the same document rather
            // than creating their own. `lib/marketing/cms/queries.ts` reads this exact id.
            .documentId("siteSettings")
            .title("Site settings"),
        ),
      S.divider(),
      S.listItem()
        .title("News")
        .id("news")
        .child(
          S.documentTypeList("newsPost")
            .title("News posts")
            .defaultOrdering([{ field: "publishedAt", direction: "desc" }]),
        ),
      S.listItem()
        .title("Gallery")
        .id("gallery")
        .child(
          S.documentTypeList("galleryImage")
            .title("Gallery photos")
            .defaultOrdering([
              { field: "position", direction: "asc" },
              { field: "_createdAt", direction: "desc" },
            ]),
        ),
    ]);
