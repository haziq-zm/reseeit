import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = { imageUrl?: string };

/** Mock receipt shape for UI development — no OCR, no persistence. */
function getMockParsedReceipt() {
  const date = new Date().toISOString().slice(0, 10);
  return {
    merchant: "Demo Store",
    date,
    items: [
      { name: "Milk", price: 60 },
      { name: "Bread", price: 40 },
    ],
    total: 100,
  };
}

/**
 * POST /api/process
 *
 * Accepts JSON: { imageUrl: string }
 * Returns a fixed mock parsed receipt (image URL is accepted for API shape only).
 * No OCR and no database writes — UI development only.
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
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }

  const parsed = getMockParsedReceipt();

  return NextResponse.json({
    parsed,
    imageUrl,
    mock: true,
  });
}
