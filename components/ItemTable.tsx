import type { ItemRow } from "@/lib/types";

type Props = {
  items: ItemRow[];
  suggestionsByItem?: Record<string, string[]>;
};

export function ItemTable({ items, suggestionsByItem }: Props) {
  if (!items.length) {
    return (
      <p className="text-sm text-ink/50 dark:text-sand/60">No line items.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-wheat dark:border-wheat/20">
      <table className="w-full min-w-[280px] text-left text-sm">
        <thead className="bg-sand/60 text-ink/75 dark:bg-ink dark:text-sand/80">
          <tr>
            <th className="px-3 py-2 font-medium">Item</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 font-medium text-right">Qty</th>
            <th className="px-3 py-2 font-medium text-right">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-wheat dark:divide-wheat/15">
          {items.map((it) => {
            const sug = suggestionsByItem?.[it.name];
            return (
              <tr key={it.id} className="bg-cream dark:bg-charcoal">
                <td className="px-3 py-2 font-medium text-ink dark:text-sand">
                  {it.name}
                  {sug && sug.length > 0 && (
                    <ul className="mt-1 list-inside list-disc text-xs font-normal text-ink/55 dark:text-sand/65">
                      {sug.slice(0, 2).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-3 py-2 text-ink/75 dark:text-sand/80">
                  <span className="rounded-full bg-wheat/80 px-2 py-0.5 text-xs text-ink dark:bg-wheat/20 dark:text-sand">
                    {it.category}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-ink/80 dark:text-sand/85">
                  {it.quantity ?? 1}
                </td>
                <td className="px-3 py-2 text-right font-medium tabular-nums text-ink dark:text-sand">
                  ₹{Number(it.price).toLocaleString("en-IN")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
