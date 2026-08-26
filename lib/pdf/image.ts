/**
 * Decode an image into something jsPDF's `addImage` accepts.
 *
 * Separate from the renderers because loading is async and browser-only, while `renderReceipt` is
 * deliberately synchronous and DOM-free so a layout bug is findable without a browser.
 *
 * never THROWS. A logo that will not load must cost the document its crest, not the download, an
 * admin is usually doing this with a parent standing at the desk.
 */
export interface PdfImage {
  dataUrl: string;
  /** jsPDF wants the format named explicitly rather than sniffing it. */
  format: "JPEG" | "PNG";
}

const FORMATS: Record<string, PdfImage["format"]> = {
  "image/jpeg": "JPEG",
  "image/jpg": "JPEG",
  "image/png": "PNG",
};

export async function loadImageData(src: string): Promise<PdfImage | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;

    const blob = await res.blob();
    const format = FORMATS[blob.type.toLowerCase()];
    // WebP, SVG and AVIF are all plausible uploads and none are formats jsPDF can embed. Dropping
    // the crest beats embedding bytes that render as a black box.
    if (!format) return null;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(blob);
    });

    return { dataUrl, format };
  } catch {
    return null;
  }
}
