import Tesseract from "tesseract.js";

/** In-memory OCR cache to avoid duplicate work for the same image URL */
const ocrCache = new Map<string, { text: string; at: number }>();
const OCR_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Extract raw text from a receipt image URL using Tesseract.js.
 * PaddleOCR is preferred for accuracy in production but needs a separate
 * service; this path runs fully inside Node for hackathon deploys.
 */
export async function extractText(imageUrl: string): Promise<string> {
  const cached = ocrCache.get(imageUrl);
  if (cached && Date.now() - cached.at < OCR_TTL_MS) {
    return cached.text;
  }

  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());

  const {
    data: { text },
  } = await Tesseract.recognize(buf, "eng", {
    logger: () => {
      /* quiet */
    },
  });

  const trimmed = text?.trim() || "";
  ocrCache.set(imageUrl, { text: trimmed, at: Date.now() });
  return trimmed;
}
