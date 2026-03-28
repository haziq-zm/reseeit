import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { ItemRow, ParsedReceipt, ReceiptRow, ReceiptWithItems } from "./types";

/** Weekly budget in INR (MVP hardcoded per spec) */
export const WEEKLY_BUDGET_INR = 5000;

let _client: SupabaseClient | null = null;

/**
 * Server-side Supabase client. Prefer SUPABASE_SERVICE_ROLE_KEY for API routes
 * so inserts bypass RLS; falls back to anon key for demos with open policies.
 */
export function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)"
    );
  }
  if (!_client) {
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
      (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function getDemoUserId(): string {
  return (
    process.env.DEMO_USER_ID ||
    "00000000-0000-4000-8000-000000000001"
  );
}

export async function insertReceiptWithItems(
  parsed: ParsedReceipt,
  imageUrl: string | null,
  itemsWithCategories: { name: string; price: number; quantity: number; category: string }[]
): Promise<ReceiptWithItems> {
  const supabase = getSupabase();
  const userId = getDemoUserId();

  const { data: receipt, error: rErr } = await supabase
    .from("receipts")
    .insert({
      user_id: userId,
      merchant: parsed.merchant,
      date: parsed.date,
      total: parsed.total,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (rErr || !receipt) {
    throw new Error(rErr?.message || "Failed to insert receipt");
  }

  const row = receipt as ReceiptRow;
  const itemPayload = itemsWithCategories.map((i) => ({
    receipt_id: row.id,
    name: i.name,
    category: i.category,
    price: i.price,
    quantity: i.quantity,
  }));

  const { data: insertedItems, error: iErr } = await supabase
    .from("items")
    .insert(itemPayload)
    .select();

  if (iErr) {
    throw new Error(iErr.message);
  }

  return {
    ...row,
    items: (insertedItems || []) as ItemRow[],
  };
}

export async function listReceiptsWithItems(
  limit = 50
): Promise<ReceiptWithItems[]> {
  const supabase = getSupabase();
  const userId = getDemoUserId();

  const { data: receipts, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  if (!receipts?.length) return [];

  const ids = receipts.map((r) => r.id);
  const { data: allItems, error: ie } = await supabase
    .from("items")
    .select("*")
    .in("receipt_id", ids);

  if (ie) throw new Error(ie.message);

  const byReceipt = new Map<string, ItemRow[]>();
  for (const it of (allItems || []) as ItemRow[]) {
    const list = byReceipt.get(it.receipt_id) || [];
    list.push(it);
    byReceipt.set(it.receipt_id, list);
  }

  return (receipts as ReceiptRow[]).map((r) => ({
    ...r,
    items: byReceipt.get(r.id) || [],
  }));
}

export async function getReceiptById(id: string): Promise<ReceiptWithItems | null> {
  const supabase = getSupabase();
  const userId = getDemoUserId();

  const { data: receipt, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!receipt) return null;

  const { data: items, error: ie } = await supabase
    .from("items")
    .select("*")
    .eq("receipt_id", id);

  if (ie) throw new Error(ie.message);

  return {
    ...(receipt as ReceiptRow),
    items: (items || []) as ItemRow[],
  };
}
