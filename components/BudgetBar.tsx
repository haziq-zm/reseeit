"use client";

type Props = {
  weeklyBudget: number;
  weeklySpent: number;
  remaining: number;
  progress: number;
};

/**
 * Weekly spend vs budget — beige track, ink/charcoal fill bands (no green/red).
 */
export function BudgetBar({
  weeklyBudget,
  weeklySpent,
  remaining,
  progress,
}: Props) {
  const pct = Math.min(100, progress * 100);
  const barColor =
    progress < 0.7
      ? "bg-charcoal"
      : progress <= 1
        ? "bg-ink"
        : "bg-black";

  return (
    <section className="rounded-2xl border border-wheat bg-gradient-to-br from-cream to-sand/50 p-5 shadow-sm dark:border-wheat/20 dark:from-charcoal dark:to-ink">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-ink/55 dark:text-sand/70">
            This week
          </h2>
          <p className="text-2xl font-bold tabular-nums text-ink dark:text-sand">
            ₹{weeklySpent.toLocaleString("en-IN")}
            <span className="text-base font-normal text-ink/50 dark:text-sand/60">
              {" "}
              / ₹{weeklyBudget.toLocaleString("en-IN")}
            </span>
          </p>
        </div>
        <p
          className={`text-sm font-medium ${
            remaining >= 0
              ? "text-ink/80 dark:text-sand"
              : "text-ink dark:text-cream"
          }`}
        >
          {remaining >= 0
            ? `₹${remaining.toLocaleString("en-IN")} left`
            : `₹${Math.abs(remaining).toLocaleString("en-IN")} over`}
        </p>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-wheat/70 dark:bg-wheat/15">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-ink/50 dark:text-sand/60">
        {(progress * 100).toFixed(0)}% of weekly budget used
      </p>
    </section>
  );
}
