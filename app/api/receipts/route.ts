import { NextResponse } from "next/server";
import { isSupabaseConfigured, listReceiptsWithItems } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ receipts: [], warning: "Supabase not configured" });
  }
  try {
    const receipts = await listReceiptsWithItems();
    return NextResponse.json({ receipts });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list receipts" },
      { status: 500 }
    );
  }
}
