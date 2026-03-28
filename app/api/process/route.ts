import { NextRequest, NextResponse } from "next/server";
import { categorizeItem } from "@/lib/categorizer";
import { insertReceiptWithItems } from "@/lib/db";
import { extractText } from "@/lib/ocr";
import { mockParsedReceipt, parseReceipt } from "@/lib/parser";

export const runtime = "nodejs";
export const maxDuration = 120;

type Body = { imageUrl?: string; forceMock?: boolean };

/**
 * Full pipeline: OCR → parse → categorize → persist receipt + line items.
 */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const imageUrl = body.imageUrl?.trim();
  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }

  let text = "";
  try {
    if (!body.forceMock) {
      text = await extractText(imageUrl);
    }
  } catch (e) {
    console.error("OCR failed, using mock parser path", e);
  }

  const parsed =
    !text || text.length < 5 ? mockParsedReceipt() : parseReceipt(text);

  const itemsWithCategories = parsed.items.map((i) => ({
    name: i.name,
    price: i.price,
    quantity: i.quantity ?? 1,
    category: categorizeItem(i.name),
  }));

  try {
    const saved = await insertReceiptWithItems(parsed, imageUrl, itemsWithCategories);
    return NextResponse.json({
      receipt: saved,
      ocrPreview: text.slice(0, 500),
      usedMock: !text || text.length < 5,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed" },
      { status: 500 }
    );
  }
}
