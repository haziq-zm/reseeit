import { randomUUID } from "crypto";
import type { ItemRow, ParsedReceipt, ReceiptRow, ReceiptWithItems } from "./types";

function demoUserId(): string {
  return process.env.DEMO_USER_ID || "00000000-0000-4000-8000-000000000001";
}

/** In-memory image blobs for mock upload → OCR/process pipeline */
const mockImages = new Map<string, { buffer: Buffer; contentType: string }>();

/** Persisted mock receipts (used when Supabase env is missing) */
let mockReceipts: ReceiptWithItems[] | null = null;

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function seedReceipts(): ReceiptWithItems[] {
  const userId = demoUserId();
  const r1: ReceiptRow = {
    id: randomUUID(),
    user_id: userId,
    merchant: "Reliance Fresh",
    date: daysAgoIso(2),
    total: 890,
    image_url: "https://placehold.co/400x600/f1f5f9/334155?text=Grocery+Receipt",
    created_at: new Date().toISOString(),
  };
  const items1: ItemRow[] = [
    {
      id: randomUUID(),
      receipt_id: r1.id,
      name: "Milk 1L",
      category: "Groceries",
      price: 56,
      quantity: 2,
    },
    {
      id: randomUUID(),
      receipt_id: r1.id,
      name: "Basmati Rice 5kg",
      category: "Groceries",
      price: 620,
      quantity: 1,
    },
    {
      id: randomUUID(),
      receipt_id: r1.id,
      name: "Uber Ride",
      category: "Transport",
      price: 120,
      quantity: 1,
    },
  ];
  r1.total = items1.reduce((s, i) => s + Number(i.price) * (i.quantity || 1), 0);

  const r2: ReceiptRow = {
    id: randomUUID(),
    user_id: userId,
    merchant: "Zara",
    date: daysAgoIso(5),
    total: 2499,
    image_url: "https://placehold.co/400x600/fae8ff/6b21a8?text=Fashion",
    created_at: new Date().toISOString(),
  };
  const items2: ItemRow[] = [
    {
      id: randomUUID(),
      receipt_id: r2.id,
      name: "Cotton Shirt",
      category: "Clothing",
      price: 1499,
      quantity: 1,
    },
    {
      id: randomUUID(),
      receipt_id: r2.id,
      name: "Jeans",
      category: "Clothing",
      price: 1000,
      quantity: 1,
    },
  ];
  r2.total = items2.reduce((s, i) => s + Number(i.price) * (i.quantity || 1), 0);

  return [
    { ...r1, items: items1 },
    { ...r2, items: items2 },
  ];
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
