import type { SchemaTypeDefinition } from "sanity";
import { galleryImage } from "./gallery-image";
import { newsPost } from "./news-post";
import { siteSettings } from "./site-settings";

/** The document type that exists exactly once. Referenced by `sanity/structure.ts` (which opens it
 *  directly instead of showing a pointless one-item list) and by `sanity.config.ts` (which removes it
 *  from the "create new document" menu so nobody can make a second one). */
export const SINGLETON_TYPES = ["siteSettings"] as const;

export const schemaTypes: SchemaTypeDefinition[] = [siteSettings, newsPost, galleryImage];
