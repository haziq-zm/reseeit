import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/lib/ocr";
import { parseReceipt } from "@/lib/parser";
import { categorizeItem } from "@/lib/categorizer";
import { insertReceiptWithItems } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = { imageUrl?: string };

/**
 * POST /api/process
 *
 * Accepts JSON: { imageUrl: string }
 * Pipeline: fetch image → OCR → parse → categorize → save to DB → respond.
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
    // 1. OCR
    const ocr = await extractText(imageUrl);
    console.log(
      `[process] OCR: ${ocr.text.length} chars, ${ocr.confidence}% confidence`
    );

    // 2. Parse
    const parsed = parseReceipt(ocr.text);
    console.log(
      `[process] Parsed: merchant="${parsed.merchant}", ${parsed.items.length} items, total=${parsed.total}`
    );

    // 3. Categorize each item
    const itemsWithCategories = parsed.items.map((item) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity ?? 1,
      category: categorizeItem(item.name),
    }));

    // 4. Save to DB (Supabase or in-memory mock)
    const saved = await insertReceiptWithItems(
      parsed,
      imageUrl,
      itemsWithCategories
    );
    console.log(`[process] Saved receipt ${saved.id} with ${saved.items.length} items`);

    return NextResponse.json({
      receipt: saved,
      rawText: ocr.text,
      confidence: ocr.confidence,
      lowQuality: ocr.lowQuality,
      charCount: ocr.text.length,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Processing failed";
    console.error("[process] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
