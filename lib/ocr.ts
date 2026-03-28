import Tesseract from "tesseract.js";

const ocrCache = new Map<string, { text: string; confidence: number; at: number }>();
const OCR_TTL_MS = 1000 * 60 * 60; // 1 hour

export interface OcrResult {
  text: string;
  confidence: number;
  lowQuality: boolean;
}

const LOW_CONFIDENCE_THRESHOLD = 40;

/**
 * Extract raw text from a receipt image URL using Tesseract.js.
 * Returns the extracted text, a confidence score (0–100), and a flag
 * when the image quality is too low to produce reliable output.
 */
export async function extractText(imageUrl: string): Promise<OcrResult> {
  const cached = ocrCache.get(imageUrl);
  if (cached && Date.now() - cached.at < OCR_TTL_MS) {
    console.log("[ocr] cache hit for", imageUrl);
    return {
      text: cached.text,
      confidence: cached.confidence,
      lowQuality: cached.confidence < LOW_CONFIDENCE_THRESHOLD,
    };
  }

  let buf: Buffer;
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`Image fetch returned HTTP ${res.status}`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`URL did not return an image (content-type: ${contentType})`);
    }
    buf = Buffer.from(await res.arrayBuffer());
  } catch (err) {
    throw new Error(
      `Could not fetch image from URL: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (buf.length < 256) {
    throw new Error("Image payload is too small — likely a broken or empty file");
  }

  let text: string;
  let confidence: number;

  try {
    const {
      data: { text: rawText, confidence: rawConf },
    } = await Tesseract.recognize(buf, "eng", {
      logger: () => {},
    });

    text = (rawText ?? "").trim();
    confidence = Math.round(rawConf ?? 0);
  } catch (err) {
    throw new Error(
      `Tesseract OCR failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const lowQuality = confidence < LOW_CONFIDENCE_THRESHOLD;

  if (lowQuality) {
    console.warn(
      `[ocr] Low confidence (${confidence}%) — image may be blurry, dark, or not a receipt`
    );
  }

  console.log(
    `[ocr] Extracted ${text.length} chars (confidence ${confidence}%) from`,
    imageUrl
  );

  ocrCache.set(imageUrl, { text, confidence, at: Date.now() });

  return { text, confidence, lowQuality };
}
