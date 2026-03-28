import { NextRequest, NextResponse } from "next/server";
import { getMockImage } from "@/lib/mock-store";

export const runtime = "nodejs";

/** Serves in-memory mock upload images (dev / no Supabase). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const hit = getMockImage(params.id);
  if (!hit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(hit.buffer), {
    headers: {
      "Content-Type": hit.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
