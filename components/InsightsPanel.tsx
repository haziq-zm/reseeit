"use client";

import type { AlternativeBlock, Insight } from "@/lib/types";

type Props = {
  insights: Insight[];
  alternatives: AlternativeBlock[];
  loading?: boolean;
};

const TYPE_CONFIG: Record<
  Insight["type"],
  { icon: string; bg: string; border: string; dot: string; label: string }
> = {
  overspending: {
    icon: "⚠",
    bg: "bg-clay/8 dark:bg-clay/12",
    border: "border-clay/25 dark:border-clay/20",
    dot: "bg-clay",
    label: "Overspending",
  },
  habit: {
    icon: "↻",
    bg: "bg-honey/10 dark:bg-honey/12",
    border: "border-honey/30 dark:border-honey/20",
    dot: "bg-honey",
    label: "Habit",
  },
  expensive: {
    icon: "↑",
    bg: "bg-accent-soft/60 dark:bg-accent/12",
    border: "border-accent/20 dark:border-accent-muted/25",
    dot: "bg-accent dark:bg-accent-muted",
    label: "Pricey",
  },
  info: {
    icon: "✓",
    bg: "bg-sage/8 dark:bg-sage/12",
    border: "border-sage/25 dark:border-sage/20",
    dot: "bg-sage",
    label: "Info",
  },
};

export function InsightsPanel({ insights, alternatives, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((n) => (
          <div
            key={n}
            className="animate-pulse rounded-2xl border border-wheat/50 bg-sand/20 px-5 py-5 dark:border-wheat/10 dark:bg-ink/20"
          >
            <div className="h-3 w-24 rounded bg-wheat/50 dark:bg-wheat/15" />
            <div className="mt-3 h-3 w-3/4 rounded bg-wheat/40 dark:bg-wheat/10" />
          </div>
        ))}
      </div>
    );
  }

  if (insights.length === 0 && alternatives.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-wheat/60 bg-cream/50 px-4 py-6 text-center text-sm leading-relaxed text-ink/50 dark:border-wheat/10 dark:bg-charcoal/40 dark:text-sand/55">
        Upload receipts to see spending insights and savings ideas here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Insight cards */}
      {insights.map((insight, idx) => {
        const cfg = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.info;
        return (
          <div
            key={idx}
            className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-4`}
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream/80 text-sm dark:bg-charcoal/80"
                aria-hidden
              >
                {cfg.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink dark:text-sand">
                    {insight.title}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-ink/50 dark:text-sand/50`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}
                      aria-hidden
                    />
                    {cfg.label}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink/65 dark:text-sand/65">
                  {insight.detail}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sage/15 text-xs dark:bg-sage/25">
              💡
            </span>
            <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink/45 dark:text-sand/50">
              Cheaper alternatives
            </h3>
          </div>

          {alternatives.map((alt, i) => (
            <div
              key={i}
              className="rounded-2xl border border-sage/20 bg-sage/5 p-4 dark:border-sage/15 dark:bg-sage/8"
            >
              <p className="text-sm font-semibold text-ink dark:text-sand">
                {alt.item}
              </p>

              <ul className="mt-3 space-y-2">
                {alt.suggestions.map((s, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-ink/70 dark:text-sand/70"
                  >
                    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-sage/60 dark:bg-sage/80" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>

              {alt.links.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-sage/15 pt-3 dark:border-sage/10">
                  {alt.links.map((href, j) => {
                    let label: string;
                    try {
                      label = new URL(href).hostname.replace(/^www\./, "");
                    } catch {
                      label = href.slice(0, 30);
                    }
                    return (
                      <a
                        key={j}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-cream/80 px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent-soft hover:text-accent-hover dark:bg-charcoal/60 dark:text-accent-muted dark:hover:bg-charcoal dark:hover:text-sand"
                      >
                        <span aria-hidden>↗</span>
                        {label}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
