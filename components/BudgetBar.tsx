type Props = {
  weeklyBudget: number;
  weeklySpent: number;
  remaining: number;
  progress: number;
};

/**
 * Visual budget bar with color bands:
 *   < 70%   → green (sage)
 *   70–100% → yellow (honey)
 *   > 100%  → red (clay)
 */
export function BudgetBar({
  weeklyBudget,
  weeklySpent,
  remaining,
  progress,
}: Props) {
  const pct = Math.min(100, progress * 100);

  const barColor =
    progress < 0.7 ? "bg-sage" : progress <= 1 ? "bg-honey" : "bg-clay";
  const dotColor =
    progress < 0.7 ? "bg-sage" : progress <= 1 ? "bg-honey" : "bg-clay";

  return (
    <section className="rounded-3xl border border-wheat/70 bg-cream/90 p-6 shadow-soft dark:border-wheat/15 dark:bg-charcoal/90 dark:shadow-soft-dark">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${dotColor} dark:opacity-90`}
          aria-hidden
        />
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink/45 dark:text-sand/50">
          Weekly budget
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <p className="text-3xl font-semibold tabular-nums tracking-tight text-ink dark:text-sand">
          ₹{weeklySpent.toLocaleString("en-IN")}
          <span className="text-lg font-normal text-ink/40 dark:text-sand/45">
            {" "}/ ₹{weeklyBudget.toLocaleString("en-IN")}
          </span>
        </p>
        <p
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            remaining > 0
              ? "bg-sage/15 text-sage dark:bg-sage/25 dark:text-sand"
              : remaining === 0
                ? "bg-honey/15 text-honey dark:bg-honey/25 dark:text-sand"
                : "bg-clay/15 text-clay dark:bg-clay/20 dark:text-[#E8A89E]"
          }`}
        >
          {remaining > 0
            ? `₹${remaining.toLocaleString("en-IN")} left`
            : remaining === 0
              ? "Budget fully used"
              : `₹${Math.abs(remaining).toLocaleString("en-IN")} over`}
        </p>
      </div>

      <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-sand/80 dark:bg-ink">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/45 dark:text-sand/50">
        <span>{(progress * 100).toFixed(0)}% of ₹{weeklyBudget.toLocaleString("en-IN")} used</span>
        <span className="flex items-center gap-1.5 text-xs text-ink/35 dark:text-sand/40">
          <span className="h-1.5 w-1.5 rounded-full bg-sage" title="< 70% — On track" />
          <span className="h-1.5 w-1.5 rounded-full bg-honey" title="70–100% — Tight" />
          <span className="h-1.5 w-1.5 rounded-full bg-clay" title="> 100% — Over budget" />
        </span>
      </p>
    </section>
  );
}
