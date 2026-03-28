import { NextRequest, NextResponse } from "next/server";
import { getDemoUserId, getSupabase, isSupabaseConfigured } from "@/lib/db";
import { storeMockImage } from "@/lib/mock-store";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;
const MAX_SIZE = 12 * 1024 * 1024; // 12 MB

/**
 * POST /api/upload
 *
 * Accepts: multipart/form-data with a single `file` field (image).
 * Stores the image in Supabase Storage bucket `receipts`.
 * Returns: { path, url } where url is the public URL of the stored image.
 *
 * Falls back to in-memory mock storage when Supabase env vars are missing.
 */
export async function POST(req: NextRequest) {
  // --- Parse multipart body ---
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Request must be multipart/form-data" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: 'Missing "file" field in form data' },
      { status: 400 }
    );
  }

  // --- Validate type ---
  const contentType = (file as File).type || "image/jpeg";
  if (!ALLOWED_TYPES.includes(contentType as typeof ALLOWED_TYPES[number])) {
    return NextResponse.json(
      {
        error: `Unsupported image type "${contentType}". Allowed: ${ALLOWED_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // --- Validate size ---
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (buf.length > MAX_SIZE) {
    return NextResponse.json(
      { error: `File too large (${(buf.length / 1024 / 1024).toFixed(1)} MB). Max ${MAX_SIZE / 1024 / 1024} MB.` },
      { status: 400 }
    );
  }

  // --- Mock fallback (no Supabase) ---
  if (!isSupabaseConfigured()) {
    const id = storeMockImage(buf, contentType);
    const url = `${req.nextUrl.origin}/api/mock-file/${id}`;
    return NextResponse.json({ path: `mock/${id}`, url, mock: true });
  }

  // --- Upload to Supabase Storage ---
  const userId = getDemoUserId();
  const safeName =
    (file as File).name?.replace(/[^a-zA-Z0-9._-]/g, "_") || "receipt.jpg";
  const storagePath = `${userId}/${Date.now()}-${safeName}`;

  const supabase = getSupabase();

  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(storagePath, buf, { contentType, upsert: false });

  if (uploadError) {
    console.error("[upload] Supabase Storage error:", uploadError);
    return NextResponse.json(
      { error: uploadError.message || "Upload to storage failed" },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("receipts").getPublicUrl(storagePath);

  return NextResponse.json({ path: storagePath, url: publicUrl });
}
