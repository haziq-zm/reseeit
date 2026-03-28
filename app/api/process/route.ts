import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/lib/ocr";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = { imageUrl?: string };

/**
 * POST /api/process
 *
 * Accepts JSON: { imageUrl: string }
 * Runs Tesseract OCR on the image and returns the raw extracted text.
 * No parsing or persistence — OCR extraction only.
 */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const imageUrl = body.imageUrl?.trim();
  if (!imageUrl) {
    return NextResponse.json(
      { error: "imageUrl is required" },
      { status: 400 }
    );
  }

  try {
    const { text, confidence, lowQuality } = await extractText(imageUrl);

    console.log("--- [/api/process] OCR result ---");
    console.log("imageUrl:", imageUrl);
    console.log("confidence:", confidence);
    console.log("lowQuality:", lowQuality);
    console.log("text:", text.slice(0, 500));
    console.log("--- end ---");

    return NextResponse.json({
      imageUrl,
      rawText: text,
      confidence,
      lowQuality,
      charCount: text.length,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "OCR processing failed";
    console.error("[/api/process] OCR error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
