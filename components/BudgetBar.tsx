"use client";

type Props = {
  weeklyBudget: number;
  weeklySpent: number;
  remaining: number;
  progress: number;
};

/**
 * Weekly spend vs budget with color bands: &lt;70% green, 70–100% yellow, &gt;100% red.
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
      ? "bg-emerald-500"
      : progress <= 1
        ? "bg-amber-400"
        : "bg-rose-500";

  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            This week
          </h2>
          <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            ₹{weeklySpent.toLocaleString("en-IN")}
            <span className="text-base font-normal text-slate-500 dark:text-slate-400">
              {" "}
              / ₹{weeklyBudget.toLocaleString("en-IN")}
            </span>
          </p>
        </div>
        <p
          className={`text-sm font-medium ${
            remaining >= 0
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {remaining >= 0
            ? `₹${remaining.toLocaleString("en-IN")} left`
            : `₹${Math.abs(remaining).toLocaleString("en-IN")} over`}
        </p>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {(progress * 100).toFixed(0)}% of weekly budget used
      </p>
    </section>
  );
}
