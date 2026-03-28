"use client";

import type { AlternativeBlock, Insight } from "@/lib/types";

type Props = {
  insights: Insight[];
  alternatives: AlternativeBlock[];
  loading?: boolean;
};

export function InsightsPanel({ insights, alternatives, loading }: Props) {
  return (
    <section className="rounded-2xl border border-wheat bg-cream p-5 shadow-sm dark:border-wheat/20 dark:bg-charcoal">
      <h2 className="mb-4 text-lg font-semibold text-ink dark:text-sand">
        Insights & savings
      </h2>
      {loading && (
        <p className="text-sm text-ink/50 dark:text-sand/60">Loading…</p>
      )}
      {!loading && insights.length === 0 && alternatives.length === 0 && (
        <p className="text-sm text-ink/50 dark:text-sand/60">
          Add receipts to see personalized insights.
        </p>
      )}
      <ul className="space-y-3">
        {insights.map((i, idx) => (
          <li
            key={idx}
            className="rounded-xl border border-wheat bg-sand/40 px-3 py-2 text-sm text-ink dark:border-wheat/25 dark:bg-ink/40 dark:text-sand"
          >
            <p className="font-medium">{i.title}</p>
            <p className="mt-0.5 text-xs text-ink/70 dark:text-sand/75">{i.detail}</p>
          </li>
        ))}
      </ul>
      {alternatives.length > 0 && (
        <div className="mt-6 border-t border-wheat pt-4 dark:border-wheat/20">
          <h3 className="mb-2 text-sm font-semibold text-ink dark:text-sand">
            Cheaper alternatives
          </h3>
          <ul className="space-y-4">
            {alternatives.map((a, i) => (
              <li key={i} className="rounded-lg bg-sand/50 p-3 dark:bg-ink/50">
                <p className="font-medium text-ink dark:text-sand">{a.item}</p>
                <ul className="mt-1 list-inside list-disc text-xs text-ink/75 dark:text-sand/80">
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
                          className="text-xs text-ink underline decoration-wheat underline-offset-2 hover:opacity-80 dark:text-sand"
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
