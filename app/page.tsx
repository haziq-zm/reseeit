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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
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
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Category mix (7 days)
            </h2>
          </div>
          <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            {categoryWeekEntries.length === 0 && (
              <li className="text-sm text-slate-500 dark:text-slate-400">No data yet.</li>
            )}
            {categoryWeekEntries.map(([cat, amt]) => (
              <li
                key={cat}
                className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200"
              >
                <span>{cat}</span>
                <span className="font-medium tabular-nums">₹{amt.toFixed(0)}</span>
              </li>
            ))}
          </ul>

          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Monthly analytics
          </h2>
          <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            {categoryMonthEntries.length === 0 && (
              <li className="text-sm text-slate-500 dark:text-slate-400">No data this month.</li>
            )}
            {categoryMonthEntries.map(([cat, amt]) => (
              <li
                key={cat}
                className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200"
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
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
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
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Recent receipts
          </h2>
          <div className="flex flex-wrap gap-2">
            <input
              type="search"
              placeholder="Search merchant…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-w-[160px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white sm:max-w-xs"
            />
            <button
              type="button"
              onClick={() => downloadCsv(exportRows)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
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
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No receipts match.{" "}
            <a href="/upload" className="text-emerald-600 underline dark:text-emerald-400">
              Upload one
            </a>
            .
          </p>
        )}
      </section>
    </div>
  );
}
