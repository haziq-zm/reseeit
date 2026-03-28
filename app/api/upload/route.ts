import { NextRequest, NextResponse } from "next/server";
import { getDemoUserId, getSupabase, isSupabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST multipart/form-data: field "file" — uploads to Supabase Storage bucket `receipts`.
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured. Set SUPABASE_URL and keys." },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (buf.length > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 12MB)" }, { status: 400 });
  }

  const userId = getDemoUserId();
  const original =
    (file as File).name?.replace(/[^a-zA-Z0-9._-]/g, "_") || "receipt.jpg";
  const path = `${userId}/${Date.now()}-${original}`;

  const supabase = getSupabase();
  const contentType = (file as File).type || "image/jpeg";

  const { error: upErr } = await supabase.storage
    .from("receipts")
    .upload(path, buf, { contentType, upsert: false });

  if (upErr) {
    console.error(upErr);
    return NextResponse.json(
      { error: upErr.message || "Upload failed" },
      { status: 500 }
    );
  }

  const { data: pub } = supabase.storage.from("receipts").getPublicUrl(path);

  return NextResponse.json({
    path,
    url: pub.publicUrl,
  });
}
