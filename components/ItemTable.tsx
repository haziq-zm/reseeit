import type { ItemRow } from "@/lib/types";

type Props = {
  items: ItemRow[];
  suggestionsByItem?: Record<string, string[]>;
};

export function ItemTable({ items, suggestionsByItem }: Props) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed border-wheat/80 py-8 text-center text-sm text-ink/50 dark:border-wheat/15 dark:text-sand/55">
        No line items.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-wheat/70 shadow-soft dark:border-wheat/12 dark:shadow-soft-dark">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="border-b border-wheat/80 bg-accent-soft/90 text-left dark:border-wheat/10 dark:bg-accent/15">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-accent dark:text-accent-muted">
                Item
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-accent dark:text-accent-muted">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-accent dark:text-accent-muted">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-accent dark:text-accent-muted">
                Price
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wheat/50 bg-cream/50 dark:divide-wheat/10 dark:bg-charcoal/40">
            {items.map((it) => {
              const sug = suggestionsByItem?.[it.name];
              return (
                <tr key={it.id} className="transition-colors hover:bg-sand/40 dark:hover:bg-ink/50">
                  <td className="px-4 py-3 align-top text-ink dark:text-sand">
                    <span className="font-medium">{it.name}</span>
                    {sug && sug.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs font-normal leading-relaxed text-ink/55 dark:text-sand/60">
                        {sug.slice(0, 2).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="inline-block rounded-full bg-sage/15 px-2.5 py-0.5 text-xs font-medium text-sage dark:bg-sage/25 dark:text-sand">
                      {it.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink/70 dark:text-sand/70">
                    {it.quantity ?? 1}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-ink dark:text-sand">
                    ₹{Number(it.price).toLocaleString("en-IN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
