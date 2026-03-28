import Link from "next/link";
import type { ReceiptWithItems } from "@/lib/types";

export function ReceiptCard({ receipt }: { receipt: ReceiptWithItems }) {
  const dateLabel = receipt.date?.slice(0, 10) || receipt.created_at?.slice(0, 10);

  return (
    <Link
      href={`/receipt/${receipt.id}`}
      className="block rounded-xl border border-wheat bg-cream p-4 shadow-sm transition hover:border-ink/30 hover:shadow-md dark:border-wheat/20 dark:bg-charcoal dark:hover:border-sand/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink dark:text-sand">{receipt.merchant}</p>
          <p className="text-xs text-ink/50 dark:text-sand/60">{dateLabel}</p>
        </div>
        <p className="shrink-0 text-lg font-bold text-ink dark:text-sand">
          ₹{Number(receipt.total).toLocaleString("en-IN")}
        </p>
      </div>
      <p className="mt-2 text-sm text-ink/65 dark:text-sand/75">
        {receipt.items.length} line item{receipt.items.length === 1 ? "" : "s"}
      </p>
    </Link>
  );
}
