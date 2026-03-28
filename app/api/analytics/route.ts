import { NextResponse } from "next/server";
import { analyzeSpending } from "@/lib/analyzer";
import {
  getDemoUserId,
  isSupabaseConfigured,
  listReceiptsWithItems,
  WEEKLY_BUDGET_INR,
} from "@/lib/db";

export const runtime = "nodejs";

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Weekly budget progress, category totals (7d + month), raw aggregates for charts.
 */
export async function GET() {
  try {
    const receipts = await listReceiptsWithItems(200);
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthStart = startOfMonth().getTime();

    let weeklySpent = 0;
    const categoryWeek: Record<string, number> = {};
    const categoryMonth: Record<string, number> = {};

    const flatItems: { receipt_id: string; name: string; category: string; price: number }[] =
      [];

    for (const r of receipts) {
      const rt = new Date(r.date).getTime();
      const created = new Date(r.created_at).getTime();
      const inWeek =
        (!Number.isNaN(rt) && rt >= weekAgo) ||
        (!Number.isNaN(created) && created >= weekAgo);
      const inMonth =
        (!Number.isNaN(rt) && rt >= monthStart) ||
        (!Number.isNaN(created) && created >= monthStart);

      if (inWeek) weeklySpent += Number(r.total || 0);

      for (const it of r.items) {
        flatItems.push({
          receipt_id: r.id,
          name: it.name,
          category: it.category,
          price: Number(it.price),
        });
        if (inWeek) {
          categoryWeek[it.category] =
            (categoryWeek[it.category] || 0) + Number(it.price);
        }
        if (inMonth) {
          categoryMonth[it.category] =
            (categoryMonth[it.category] || 0) + Number(it.price);
        }
      }
    }

    const progress =
      WEEKLY_BUDGET_INR > 0 ? weeklySpent / WEEKLY_BUDGET_INR : 0;

    const analysis = analyzeSpending(
      receipts.map((r) => ({
        id: r.id,
        date: r.date,
        total: r.total,
        created_at: r.created_at,
      })),
      flatItems
    );

    return NextResponse.json({
      userId: getDemoUserId(),
      weeklyBudget: WEEKLY_BUDGET_INR,
      weeklySpent,
      progress,
      remaining: Math.max(0, WEEKLY_BUDGET_INR - weeklySpent),
      categoryWeek,
      categoryMonth,
      insightsPreview: analysis,
      ...(!isSupabaseConfigured() && { mock: true as const }),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Analytics failed" },
      { status: 500 }
    );
  }
}
