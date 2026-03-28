import { randomUUID } from "crypto";
import { MOCK_RECEIPTS } from "./dashboard-mock";
import type { ItemRow, ParsedReceipt, ReceiptRow, ReceiptWithItems } from "./types";

function demoUserId(): string {
  return process.env.DEMO_USER_ID || "00000000-0000-4000-8000-000000000001";
}

/** In-memory image blobs for mock upload → OCR/process pipeline */
const mockImages = new Map<string, { buffer: Buffer; contentType: string }>();

/** Persisted mock receipts (used when Supabase env is missing) */
let mockReceipts: ReceiptWithItems[] | null = null;

function seedReceipts(): ReceiptWithItems[] {
  return MOCK_RECEIPTS.map((r) => ({
    ...r,
    items: r.items.map((i) => ({ ...i })),
  }));
}

export function getMockReceiptsList(): ReceiptWithItems[] {
  if (!mockReceipts) {
    mockReceipts = seedReceipts();
  }
  return [...mockReceipts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getMockReceiptById(id: string): ReceiptWithItems | null {
  return getMockReceiptsList().find((r) => r.id === id) || null;
}

export function storeMockImage(buffer: Buffer, contentType: string): string {
  const id = randomUUID();
  mockImages.set(id, { buffer, contentType });
  return id;
}

export function getMockImage(id: string): { buffer: Buffer; contentType: string } | null {
  return mockImages.get(id) ?? null;
}

export function insertMockReceiptWithItems(
  parsed: ParsedReceipt,
  imageUrl: string | null,
  itemsWithCategories: {
    name: string;
    price: number;
    quantity: number;
    category: string;
  }[]
): ReceiptWithItems {
  const list = getMockReceiptsList();
  const userId = demoUserId();
  const row: ReceiptRow = {
    id: randomUUID(),
    user_id: userId,
    merchant: parsed.merchant,
    date: parsed.date,
    total: parsed.total,
    image_url: imageUrl,
    created_at: new Date().toISOString(),
  };
  const items: ItemRow[] = itemsWithCategories.map((i) => ({
    id: randomUUID(),
    receipt_id: row.id,
    name: i.name,
    category: i.category,
    price: i.price,
    quantity: i.quantity,
  }));
  const full: ReceiptWithItems = { ...row, items };
  mockReceipts = [full, ...list];
  return full;
}
