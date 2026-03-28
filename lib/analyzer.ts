import type { AnalyzerResult, Insight, ItemRow, ReceiptRow } from "./types";
import { WEEKLY_BUDGET_INR } from "./db";

const CATEGORY_SPEND_RATIO = 0.35;
const HABIT_MIN_COUNT = 3;
const EXPENSIVE_MULTIPLIER = 1.5;

type ReceiptLite = Pick<ReceiptRow, "id" | "date" | "total" | "created_at">;
type ItemLite = Pick<ItemRow, "name" | "category" | "price" | "receipt_id">;

function withinLastDays(isoDate: string, days: number): boolean {
  const t = new Date(isoDate).getTime();
  if (Number.isNaN(t)) return true;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return t >= cutoff;
}

/**
 * Rule-based spending insights: overspending by category, repeat habits, expensive outliers.
 */
export function analyzeSpending(
  receipts: ReceiptLite[],
  items: ItemLite[]
): AnalyzerResult {
  const insights: Insight[] = [];
  const flaggedItems: AnalyzerResult["flaggedItems"] = [];

  const weekReceipts = receipts.filter(
    (r) => withinLastDays(r.date, 7) || withinLastDays(r.created_at, 7)
  );
  const weekIds = new Set(weekReceipts.map((r) => r.id));
  const weekItems = items.filter((i) => weekIds.has(i.receipt_id));

  const weeklySpent = weekReceipts.reduce((s, r) => s + Number(r.total || 0), 0);

  if (weeklySpent > WEEKLY_BUDGET_INR) {
    insights.push({
      type: "overspending",
      title: "Weekly budget exceeded",
      detail: `You have spent ₹${weeklySpent.toFixed(0)} this week vs budget ₹${WEEKLY_BUDGET_INR}.`,
    });
  }

  const byCat: Record<string, number> = {};
  for (const i of weekItems) {
    byCat[i.category] = (byCat[i.category] || 0) + Number(i.price);
  }

  for (const [cat, amt] of Object.entries(byCat)) {
    if (weeklySpent > 0 && amt / weeklySpent > CATEGORY_SPEND_RATIO && amt > 500) {
      insights.push({
        type: "overspending",
        title: `High ${cat} share`,
        detail: `${cat} is about ${((amt / weeklySpent) * 100).toFixed(0)}% of this week's spend (₹${amt.toFixed(0)}).`,
      });
    }
  }

  const nameCount: Record<string, number> = {};
  for (const i of weekItems) {
    const key = i.name.toLowerCase().trim();
    nameCount[key] = (nameCount[key] || 0) + 1;
  }
  for (const [name, count] of Object.entries(nameCount)) {
    if (count >= HABIT_MIN_COUNT) {
      insights.push({
        type: "habit",
        title: "Recurring purchase pattern",
        detail: `"${name}" appears ${count} times in the last 7 days.`,
      });
    }
  }

  const catPrices: Record<string, number[]> = {};
  for (const i of weekItems) {
    if (!catPrices[i.category]) catPrices[i.category] = [];
    catPrices[i.category].push(Number(i.price));
  }

  for (const i of weekItems) {
    const arr = catPrices[i.category] || [];
    if (arr.length < 2) continue;
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    if (Number(i.price) > avg * EXPENSIVE_MULTIPLIER && Number(i.price) >= 100) {
      flaggedItems.push({
        name: i.name,
        category: i.category,
        price: Number(i.price),
        reason: `Price is ~${EXPENSIVE_MULTIPLIER}× the average for ${i.category} this week.`,
      });
    }
  }

  if (insights.length === 0 && flaggedItems.length === 0) {
    insights.push({
      type: "info",
      title: "Looking good",
      detail: "No major spending flags in the last 7 days.",
    });
  }

  return { insights, flaggedItems };
}
