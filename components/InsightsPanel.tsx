"use client";

import type { AlternativeBlock, Insight } from "@/lib/types";

type Props = {
  insights: Insight[];
  alternatives: AlternativeBlock[];
  loading?: boolean;
};

export function InsightsPanel({ insights, alternatives, loading }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
        Insights & savings
      </h2>
      {loading && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      )}
      {!loading && insights.length === 0 && alternatives.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add receipts to see personalized insights.
        </p>
      )}
      <ul className="space-y-3">
        {insights.map((i, idx) => (
          <li
            key={idx}
            className={`rounded-xl border px-3 py-2 text-sm ${
              i.type === "overspending"
                ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
                : i.type === "habit"
                  ? "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-100"
                  : i.type === "expensive"
                    ? "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100"
                    : "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
            }`}
          >
            <p className="font-medium">{i.title}</p>
            <p className="mt-0.5 text-xs opacity-90">{i.detail}</p>
          </li>
        ))}
      </ul>
      {alternatives.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
          <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            Cheaper alternatives
          </h3>
          <ul className="space-y-4">
            {alternatives.map((a, i) => (
              <li key={i} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="font-medium text-slate-900 dark:text-white">{a.item}</p>
                <ul className="mt-1 list-inside list-disc text-xs text-slate-600 dark:text-slate-300">
                  {a.suggestions.map((s, j) => (
                    <li key={j}>{s}</li>
                  ))}
                </ul>
                {a.links.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {a.links.map((href, j) => (
                      <li key={j}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 underline hover:text-emerald-500 dark:text-emerald-400"
                        >
                          {href.replace(/^https?:\/\//, "").slice(0, 48)}…
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
