import { BudgetBar } from "@/components/BudgetBar";
import { ReceiptCard } from "@/components/ReceiptCard";
import { computeBudget, MOCK_RECEIPTS, summarizeCategories } from "@/lib/dashboard-mock";

export default function DashboardPage() {
  const budget = computeBudget(MOCK_RECEIPTS);
  const categoryRows = summarizeCategories(MOCK_RECEIPTS);

  return (
    <div className="space-y-8 font-[family-name:var(--font-geist-sans)] sm:space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-sand">
          Dashboard
        </h1>
        <p className="max-w-md text-[0.9375rem] leading-relaxed text-ink/60 dark:text-sand/65">
          Weekly budget overview, spending by category, and your latest receipts.
        </p>
      </header>

      <BudgetBar
        weeklyBudget={budget.weeklyBudget}
        weeklySpent={budget.weeklySpent}
        remaining={budget.remaining}
        progress={budget.progress}
      />

      <section className="rounded-2xl border border-wheat/70 bg-cream/70 p-5 shadow-soft dark:border-wheat/12 dark:bg-charcoal/70 dark:shadow-soft-dark">
        <h2 className="label-min mb-4">By category</h2>
        <p className="mb-4 text-sm text-ink/55 dark:text-sand/60">
          Totals across the sample receipts below (mock data).
        </p>
        <ul className="divide-y divide-wheat/60 dark:divide-wheat/10">
          {categoryRows.map(({ category, total }) => (
            <li
              key={category}
              className="flex items-center justify-between gap-4 py-3.5 text-sm first:pt-0"
            >
              <span className="text-ink dark:text-sand">{category}</span>
              <span className="font-medium tabular-nums text-accent dark:text-accent-muted">
                ₹{total.toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-wheat/70 bg-cream/70 p-5 shadow-soft dark:border-wheat/12 dark:bg-charcoal/70 dark:shadow-soft-dark">
        <h2 className="label-min mb-5">Receipts</h2>
        <div className="flex flex-col gap-0">
          {MOCK_RECEIPTS.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))}
        </div>
      </section>
    </div>
  );
}
