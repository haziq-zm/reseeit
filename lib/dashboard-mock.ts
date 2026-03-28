import type { ItemRow, ReceiptRow, ReceiptWithItems } from "./types";

const userId = "00000000-0000-4000-8000-000000000001";

/** Weekly budget limit in INR (hardcoded for MVP). */
export const WEEKLY_BUDGET = 5000;

export interface BudgetSummary {
  weeklyBudget: number;
  weeklySpent: number;
  remaining: number;
  progress: number;
}

/**
 * Compute budget summary from a list of receipts.
 * Sums every receipt `total`; computes remaining and progress ratio.
 * Reusable — works with mock data now, real DB rows later.
 */
export function computeBudget(
  receipts: ReceiptWithItems[],
  budget = WEEKLY_BUDGET
): BudgetSummary {
  const weeklySpent = receipts.reduce(
    (sum, r) => sum + Number(r.total || 0),
    0
  );
  const remaining = budget - weeklySpent;
  const progress = budget > 0 ? weeklySpent / budget : 0;
  return { weeklyBudget: budget, weeklySpent, remaining, progress };
}

/** Deterministic IDs so receipt detail works with mock API store. */
const r1: ReceiptRow = {
  id: "a1111111-1111-4111-8111-111111111111",
  user_id: userId,
  merchant: "Reliance Fresh",
  date: "2026-03-27",
  total: 852,
  image_url: "https://placehold.co/400x600/f1f5f9/334155?text=Grocery",
  created_at: "2026-03-27T10:00:00.000Z",
};

const items1: ItemRow[] = [
  {
    id: "i1111111-1111-4111-8111-111111111101",
    receipt_id: r1.id,
    name: "Milk 1L",
    category: "Groceries",
    price: 56,
    quantity: 2,
  },
  {
    id: "i1111111-1111-4111-8111-111111111102",
    receipt_id: r1.id,
    name: "Basmati Rice 5kg",
    category: "Groceries",
    price: 620,
    quantity: 1,
  },
  {
    id: "i1111111-1111-4111-8111-111111111103",
    receipt_id: r1.id,
    name: "Uber Ride",
    category: "Transport",
    price: 120,
    quantity: 1,
  },
];

const r2: ReceiptRow = {
  id: "b2222222-2222-4222-8222-222222222222",
  user_id: userId,
  merchant: "Zara",
  date: "2026-03-24",
  total: 2499,
  image_url: "https://placehold.co/400x600/fae8ff/6b21a8?text=Fashion",
  created_at: "2026-03-24T14:30:00.000Z",
};

const items2: ItemRow[] = [
  {
    id: "i2222222-2222-4222-8222-222222222201",
    receipt_id: r2.id,
    name: "Cotton Shirt",
    category: "Clothing",
    price: 1499,
    quantity: 1,
  },
  {
    id: "i2222222-2222-4222-8222-222222222202",
    receipt_id: r2.id,
    name: "Jeans",
    category: "Clothing",
    price: 1000,
    quantity: 1,
  },
];

const r3: ReceiptRow = {
  id: "c3333333-3333-4333-8333-333333333333",
  user_id: userId,
  merchant: "Blue Tokai",
  date: "2026-03-28",
  total: 680,
  image_url: "https://placehold.co/400x600/e8dcc8/5c4d3c?text=Cafe",
  created_at: "2026-03-28T09:15:00.000Z",
};

const items3: ItemRow[] = [
  {
    id: "i3333333-3333-4333-8333-333333333301",
    receipt_id: r3.id,
    name: "Pour-over + pastry",
    category: "Dining",
    price: 380,
    quantity: 1,
  },
  {
    id: "i3333333-3333-4333-8333-333333333302",
    receipt_id: r3.id,
    name: "Beans 250g",
    category: "Groceries",
    price: 300,
    quantity: 1,
  },
];

/** Mock receipts for dashboard list and mock DB seed. */
export const MOCK_RECEIPTS: ReceiptWithItems[] = [
  { ...r3, items: items3 },
  { ...r1, items: items1 },
  { ...r2, items: items2 },
];

/** Sum item spend by category for a simple summary. */
export function summarizeCategories(receipts: ReceiptWithItems[]): { category: string; total: number }[] {
  const map: Record<string, number> = {};
  for (const r of receipts) {
    for (const it of r.items) {
      const qty = it.quantity ?? 1;
      map[it.category] = (map[it.category] || 0) + Number(it.price) * qty;
    }
  }
  return Object.entries(map)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}
