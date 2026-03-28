import type { AnalyzerResult, Insight, ItemRow, ReceiptRow, ReceiptWithItems } from "./types";

// ---------------------------------------------------------------------------
// Tuning knobs — adjust thresholds without touching logic
// ---------------------------------------------------------------------------

const WEEKLY_BUDGET   = 5000;
/** Flag a category when it exceeds this share of total spend. */
const CATEGORY_RATIO  = 0.35;
/** Minimum spend in a category before we flag it (avoids noisy alerts). */
const CATEGORY_MIN    = 500;
/** An item bought this many times in the window is a "habit". */
const HABIT_COUNT     = 3;
/** Price must exceed category avg by this factor to be "expensive". */
const EXPENSIVE_MULT  = 1.5;
/** Absolute floor — don't flag cheap items even if they're above avg. */
const EXPENSIVE_FLOOR = 100;
/** Analysis window in days. */
const WINDOW_DAYS     = 7;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function withinWindow(isoDate: string): boolean {
  const t = new Date(isoDate).getTime();
  if (Number.isNaN(t)) return true;
  return t >= Date.now() - WINDOW_DAYS * 86_400_000;
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convenience overload: accepts `ReceiptWithItems[]` (most common in the
 * codebase) and flattens receipts + items for the core analyzer.
 */
export function analyzeReceiptList(list: ReceiptWithItems[]): AnalyzerResult {
  const items = list.flatMap((r) => r.items);
  return analyzeSpending(list, items);
}

/**
 * Rule-based spending analysis. Deterministic, no I/O, no randomness.
 *
 * 1. **Overspending** — total weekly spend vs budget, and per-category share.
 * 2. **Habit detection** — same item name appearing ≥ HABIT_COUNT times.
 * 3. **Expensive outliers** — item price > EXPENSIVE_MULT × category average.
 */
export function analyzeSpending(
  receipts: Pick<ReceiptRow, "id" | "date" | "total" | "created_at">[],
  items: Pick<ItemRow, "name" | "category" | "price" | "receipt_id">[],
): AnalyzerResult {
  const insights: Insight[] = [];
  const flaggedItems: AnalyzerResult["flaggedItems"] = [];

  // Scope to the analysis window
  const windowReceipts = receipts.filter(
    (r) => withinWindow(r.date) || withinWindow(r.created_at),
  );
  const windowIds = new Set(windowReceipts.map((r) => r.id));
  const windowItems = items.filter((i) => windowIds.has(i.receipt_id));

  const weeklySpent = windowReceipts.reduce(
    (s, r) => s + Number(r.total || 0),
    0,
  );

  // ---- 1. Overspending: budget ----
  if (weeklySpent > WEEKLY_BUDGET) {
    insights.push({
      type: "overspending",
      title: "Weekly budget exceeded",
      detail: `You spent ₹${weeklySpent.toLocaleString("en-IN")} this week — ₹${(weeklySpent - WEEKLY_BUDGET).toLocaleString("en-IN")} over your ₹${WEEKLY_BUDGET.toLocaleString("en-IN")} budget.`,
    });
  }

  // ---- 1b. Overspending: category share ----
  const byCat: Record<string, number> = {};
  for (const i of windowItems) {
    byCat[i.category] = (byCat[i.category] || 0) + Number(i.price);
  }

  if (weeklySpent > 0) {
    for (const [cat, amt] of Object.entries(byCat)) {
      const ratio = amt / weeklySpent;
      if (ratio > CATEGORY_RATIO && amt > CATEGORY_MIN) {
        insights.push({
          type: "overspending",
          title: `High ${cat} spending`,
          detail: `${cat} accounts for ${(ratio * 100).toFixed(0)}% of this week's spend (₹${amt.toLocaleString("en-IN")}).`,
        });
      }
    }
  }

  // ---- 2. Habit detection ----
  const nameCount: Record<string, { count: number; display: string }> = {};
  for (const i of windowItems) {
    const key = normalize(i.name);
    if (!nameCount[key]) {
      nameCount[key] = { count: 0, display: i.name };
    }
    nameCount[key].count += 1;
  }

  for (const { count, display } of Object.values(nameCount)) {
    if (count >= HABIT_COUNT) {
      insights.push({
        type: "habit",
        title: "Recurring purchase",
        detail: `"${display}" bought ${count} times in the last ${WINDOW_DAYS} days.`,
      });
    }
  }

  // ---- 3. Expensive outliers ----
  const catPrices: Record<string, number[]> = {};
  for (const i of windowItems) {
    (catPrices[i.category] ??= []).push(Number(i.price));
  }

  const seen = new Set<string>();
  for (const i of windowItems) {
    const prices = catPrices[i.category];
    if (!prices || prices.length < 2) continue;

    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const price = Number(i.price);
    const key = `${normalize(i.name)}:${price}`;

    if (price > avg * EXPENSIVE_MULT && price >= EXPENSIVE_FLOOR && !seen.has(key)) {
      seen.add(key);
      flaggedItems.push({
        name: i.name,
        category: i.category,
        price,
        reason: `₹${price.toLocaleString("en-IN")} is ${(price / avg).toFixed(1)}× the average for ${i.category} (₹${Math.round(avg).toLocaleString("en-IN")}).`,
      });
    }
  }

  if (flaggedItems.length > 0) {
    insights.push({
      type: "expensive",
      title: `${flaggedItems.length} pricey item${flaggedItems.length > 1 ? "s" : ""} detected`,
      detail: "Some purchases are significantly above the category average — cheaper alternatives may exist.",
    });
  }

  // ---- Fallback ----
  if (insights.length === 0) {
    insights.push({
      type: "info",
      title: "Looking good",
      detail: `No spending flags in the last ${WINDOW_DAYS} days. Keep it up!`,
    });
  }

  return { insights, flaggedItems };
}
