import Link from "next/link";
import type { ReceiptWithItems } from "@/lib/types";

export function ReceiptCard({ receipt }: { receipt: ReceiptWithItems }) {
  const dateLabel = receipt.date?.slice(0, 10) || receipt.created_at?.slice(0, 10);

  return (
    <Link
      href={`/receipt/${receipt.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            {receipt.merchant}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{dateLabel}</p>
        </div>
        <p className="shrink-0 text-lg font-bold text-emerald-600 dark:text-emerald-400">
          ₹{Number(receipt.total).toLocaleString("en-IN")}
        </p>
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {receipt.items.length} line item{receipt.items.length === 1 ? "" : "s"}
      </p>
    </Link>
  );
}
