import { NextRequest, NextResponse } from "next/server";
import { getReceiptById, isSupabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const receipt = await getReceiptById(id);
    if (!receipt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      receipt,
      ...(!isSupabaseConfigured() && { mock: true as const }),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
