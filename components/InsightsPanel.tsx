"use client";

import type { AlternativeBlock, Insight } from "@/lib/types";

type Props = {
  insights: Insight[];
  alternatives: AlternativeBlock[];
  loading?: boolean;
};

export function InsightsPanel({ insights, alternatives, loading }: Props) {
  return (
    <section className="space-y-4">
      {loading && (
        <p className="rounded-2xl border border-dashed border-wheat/80 bg-sand/30 px-4 py-6 text-center text-sm text-ink/50 dark:border-wheat/15 dark:bg-ink/30 dark:text-sand/55">
          Loading suggestions…
        </p>
      )}
      {!loading && insights.length === 0 && alternatives.length === 0 && (
        <p className="rounded-2xl border border-wheat/60 bg-cream/60 px-4 py-5 text-sm leading-relaxed text-ink/55 dark:border-wheat/10 dark:bg-charcoal/50 dark:text-sand/60">
          Add receipts to see personalized insights and savings ideas here.
        </p>
      )}
      {insights.length > 0 && (
        <ul className="space-y-3">
          {insights.map((i, idx) => (
            <li
              key={idx}
              className="rounded-2xl border border-wheat/50 bg-gradient-to-r from-accent-soft/80 to-cream pl-4 pr-4 py-4 dark:border-wheat/10 dark:from-accent/10 dark:to-charcoal/60"
            >
              <p className="text-sm font-semibold text-ink dark:text-sand">{i.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65 dark:text-sand/70">
                {i.detail}
              </p>
            </li>
          ))}
        </ul>
      )}
      {alternatives.length > 0 && (
        <div className="mt-2">
          <h3 className="label-min mb-3">Cheaper options</h3>
          <ul className="space-y-4">
            {alternatives.map((a, i) => (
              <li
                key={i}
                className="rounded-2xl border border-wheat/60 bg-cream/70 p-4 dark:border-wheat/10 dark:bg-charcoal/70"
              >
                <p className="text-sm font-semibold text-accent dark:text-accent-muted">
                  {a.item}
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/70 dark:text-sand/75">
                  {a.suggestions.map((s, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-honey" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                {a.links.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-wheat/50 pt-3 dark:border-wheat/10">
                    {a.links.map((href, j) => (
                      <li key={j}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent dark:text-accent-muted dark:decoration-accent-muted/40"
                        >
                          {href.replace(/^https?:\/\//, "").slice(0, 52)}…
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
