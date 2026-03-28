"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BudgetBar } from "@/components/BudgetBar";
import { InsightsPanel } from "@/components/InsightsPanel";
import { ReceiptCard } from "@/components/ReceiptCard";
import type { AlternativeBlock, Insight, ReceiptWithItems } from "@/lib/types";
import { useAppStore } from "@/stores/useAppStore";
import { useMemo } from "react";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function downloadCsv(rows: { merchant: string; date: string; item: string; category: string; price: number }[]) {
  const header = "merchant,date,item,category,price\n";
  const body = rows
    .map(
      (r) =>
        `"${r.merchant.replace(/"/g, '""')}","${r.date}","${r.item.replace(/"/g, '""')}","${r.category}",${r.price}`
    )
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `smart-receipt-ai-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const search = useAppStore((s) => s.receiptSearch);
  const setSearch = useAppStore((s) => s.setReceiptSearch);

  const { data: receiptsData } = useQuery({
    queryKey: ["receipts"],
    queryFn: () => fetchJson<{ receipts: ReceiptWithItems[] }>("/api/receipts"),
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: () =>
      fetchJson<{
        weeklyBudget: number;
        weeklySpent: number;
        progress: number;
        remaining: number;
        categoryWeek: Record<string, number>;
        categoryMonth: Record<string, number>;
        insightsPreview: { insights: Insight[]; flaggedItems: unknown[] };
      }>("/api/analytics"),
  });

  const {
    data: recData,
    isFetching: recFetching,
    refetch: refetchRec,
  } = useQuery({
    queryKey: ["recommendations-ui"],
    queryFn: () =>
      fetchJson<{ insights: Insight[]; alternatives: AlternativeBlock[] }>(
        "/api/recommendations",
        { method: "POST" }
      ),
    staleTime: 60_000,
  });

  const filteredReceipts = useMemo(() => {
    const list = receiptsData?.receipts || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => r.merchant.toLowerCase().includes(q));
  }, [receiptsData, search]);

  const categoryWeekEntries = Object.entries(analytics?.categoryWeek || {}).sort(
    (a, b) => b[1] - a[1]
  );
  const categoryMonthEntries = Object.entries(analytics?.categoryMonth || {}).sort(
    (a, b) => b[1] - a[1]
  );

  const exportRows = useMemo(() => {
    const rows: { merchant: string; date: string; item: string; category: string; price: number }[] =
      [];
    for (const r of receiptsData?.receipts || []) {
      for (const it of r.items) {
        rows.push({
          merchant: r.merchant,
          date: r.date,
          item: it.name,
          category: it.category,
          price: Number(it.price),
        });
      }
    }
    return rows;
  }, [receiptsData]);

  const insights =
    recData?.insights?.length ? recData.insights : analytics?.insightsPreview?.insights || [];
  const alternatives = recData?.alternatives || [];

  return (
    <div className="space-y-8 font-[family-name:var(--font-geist-sans)]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-sand">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-ink/65 dark:text-sand/75">
          Weekly budget, receipts, and AI-powered savings ideas.
        </p>
      </div>

      {analytics && (
        <BudgetBar
          weeklyBudget={analytics.weeklyBudget}
          weeklySpent={analytics.weeklySpent}
          remaining={analytics.remaining}
          progress={analytics.progress}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-ink dark:text-sand">
              Category mix (7 days)
            </h2>
          </div>
          <ul className="space-y-2 rounded-xl border border-wheat bg-cream p-4 dark:border-wheat/20 dark:bg-charcoal">
            {categoryWeekEntries.length === 0 && (
              <li className="text-sm text-ink/50 dark:text-sand/60">No data yet.</li>
            )}
            {categoryWeekEntries.map(([cat, amt]) => (
              <li
                key={cat}
                className="flex items-center justify-between text-sm text-ink/85 dark:text-sand"
              >
                <span>{cat}</span>
                <span className="font-medium tabular-nums">₹{amt.toFixed(0)}</span>
              </li>
            ))}
          </ul>

          <h2 className="text-lg font-semibold text-ink dark:text-sand">
            Monthly analytics
          </h2>
          <ul className="space-y-2 rounded-xl border border-wheat bg-cream p-4 dark:border-wheat/20 dark:bg-charcoal">
            {categoryMonthEntries.length === 0 && (
              <li className="text-sm text-ink/50 dark:text-sand/60">No data this month.</li>
            )}
            {categoryMonthEntries.map(([cat, amt]) => (
              <li
                key={cat}
                className="flex items-center justify-between text-sm text-ink/85 dark:text-sand"
              >
                <span>{cat}</span>
                <span className="font-medium tabular-nums">₹{amt.toFixed(0)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["recommendations-ui"] });
                void refetchRec();
              }}
              disabled={recFetching}
              className="rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-cream hover:bg-charcoal disabled:opacity-50 dark:bg-sand dark:text-ink dark:hover:bg-wheat"
            >
              {recFetching ? "Refreshing…" : "Refresh Exa suggestions"}
            </button>
          </div>
          <InsightsPanel
            insights={insights}
            alternatives={alternatives}
            loading={recFetching && !recData}
          />
        </div>
      </div>

      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-ink dark:text-sand">
            Recent receipts
          </h2>
          <div className="flex flex-wrap gap-2">
            <input
              type="search"
              placeholder="Search merchant…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-w-[160px] flex-1 rounded-lg border border-wheat bg-cream px-3 py-2 text-sm text-ink placeholder:text-ink/40 dark:border-wheat/25 dark:bg-charcoal dark:text-sand sm:max-w-xs"
            />
            <button
              type="button"
              onClick={() => downloadCsv(exportRows)}
              className="rounded-lg border border-wheat px-3 py-2 text-xs font-semibold text-ink hover:bg-sand/50 dark:border-wheat/25 dark:text-sand dark:hover:bg-ink/60"
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredReceipts.map((r) => (
            <ReceiptCard key={r.id} receipt={r} />
          ))}
        </div>
        {filteredReceipts.length === 0 && (
          <p className="text-sm text-ink/55 dark:text-sand/65">
            No receipts match.{" "}
            <a href="/upload" className="text-ink underline decoration-wheat underline-offset-2 dark:text-sand">
              Upload one
            </a>
            .
          </p>
        )}
      </section>
    </div>
  );
}
