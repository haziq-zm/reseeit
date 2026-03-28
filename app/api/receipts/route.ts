import { NextResponse } from "next/server";
import { isSupabaseConfigured, listReceiptsWithItems } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const receipts = await listReceiptsWithItems();
    return NextResponse.json({
      receipts,
      ...(!isSupabaseConfigured() && { mock: true as const }),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list receipts" },
      { status: 500 }
    );
  }
}
