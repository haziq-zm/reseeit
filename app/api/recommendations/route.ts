import { NextResponse } from "next/server";
import { analyzeSpending } from "@/lib/analyzer";
import { isSupabaseConfigured, listReceiptsWithItems } from "@/lib/db";
import { getAlternatives } from "@/lib/exa";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Runs analyzer + Exa cheaper-alternative search for flagged expensive items.
 */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      insights: [],
      alternatives: [],
      note: "Supabase not configured",
    });
  }

  try {
    const receipts = await listReceiptsWithItems(200);
    const flatItems = receipts.flatMap((r) =>
      r.items.map((it) => ({
        receipt_id: r.id,
        name: it.name,
        category: it.category,
        price: Number(it.price),
      }))
    );

    const { insights, flaggedItems } = analyzeSpending(
      receipts.map((r) => ({
        id: r.id,
        date: r.date,
        total: r.total,
        created_at: r.created_at,
      })),
      flatItems
    );

    const seen = new Set<string>();
    const alternatives: {
      item: string;
      suggestions: string[];
      links: string[];
    }[] = [];

    for (const f of flaggedItems) {
      const k = `${f.name}::${f.category}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const alt = await getAlternatives(f.name, f.category);
      alternatives.push({
        item: f.name,
        suggestions: alt.suggestions,
        links: alt.links,
      });
    }

    return NextResponse.json({ insights, alternatives });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Recommendations failed" },
      { status: 500 }
    );
  }
}
