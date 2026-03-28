import { NextResponse } from "next/server";
import { analyzeReceiptList } from "@/lib/analyzer";
import { isSupabaseConfigured, listReceiptsWithItems } from "@/lib/db";
import { getAlternatives } from "@/lib/exa";
import type { AlternativeBlock } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/recommendations
 *
 * 1. Fetch receipts from DB (or mock store)
 * 2. Run the spending analyzer
 * 3. For each unique flagged item → call Exa (in parallel, deduplicated)
 * 4. Return { insights, alternatives }
 */
export async function POST() {
  try {
    // 1. Fetch receipts
    const receipts = await listReceiptsWithItems(200);

    // 2. Analyze spending
    const { insights, flaggedItems } = analyzeReceiptList(receipts);

    // 3. Deduplicate flagged items by name+category, then fetch alternatives in parallel
    const unique = new Map<string, { name: string; category: string }>();
    for (const f of flaggedItems) {
      const key = `${f.name.toLowerCase()}::${f.category.toLowerCase()}`;
      if (!unique.has(key)) {
        unique.set(key, { name: f.name, category: f.category });
      }
    }

    const entries = Array.from(unique.values());
    const settled = await Promise.allSettled(
      entries.map((e) => getAlternatives(e.name, e.category)),
    );

    const alternatives: AlternativeBlock[] = [];
    for (let i = 0; i < entries.length; i++) {
      const result = settled[i];
      if (result.status === "fulfilled") {
        alternatives.push({
          item: entries[i].name,
          suggestions: result.value.suggestions,
          links: result.value.links,
        });
      }
    }

    // 4. Return combined result
    return NextResponse.json({
      insights,
      alternatives,
      ...(!isSupabaseConfigured() && { mock: true as const }),
    });
  } catch (e) {
    console.error("[recommendations]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Recommendations failed" },
      { status: 500 },
    );
  }
}
