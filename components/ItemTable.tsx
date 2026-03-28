import type { ItemRow } from "@/lib/types";

type Props = {
  items: ItemRow[];
  suggestionsByItem?: Record<string, string[]>;
};

export function ItemTable({ items, suggestionsByItem }: Props) {
  if (!items.length) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">No line items.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[280px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <tr>
            <th className="px-3 py-2 font-medium">Item</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 font-medium text-right">Qty</th>
            <th className="px-3 py-2 font-medium text-right">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((it) => {
            const sug = suggestionsByItem?.[it.name];
            return (
              <tr key={it.id} className="bg-white dark:bg-slate-900">
                <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">
                  {it.name}
                  {sug && sug.length > 0 && (
                    <ul className="mt-1 list-inside list-disc text-xs font-normal text-slate-500 dark:text-slate-400">
                      {sug.slice(0, 2).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-800 dark:text-emerald-300">
                    {it.category}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-200">
                  {it.quantity ?? 1}
                </td>
                <td className="px-3 py-2 text-right font-medium tabular-nums text-slate-900 dark:text-white">
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
