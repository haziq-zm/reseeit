import Link from "next/link";
import type { ReceiptWithItems } from "@/lib/types";

export function ReceiptCard({ receipt }: { receipt: ReceiptWithItems }) {
  const dateLabel = receipt.date?.slice(0, 10) || receipt.created_at?.slice(0, 10);

  return (
    <Link
      href={`/receipt/${receipt.id}`}
      className="group mb-3 block rounded-2xl border border-wheat/80 bg-cream/80 p-4 shadow-soft transition-all hover:border-accent/25 hover:shadow-md dark:border-wheat/12 dark:bg-charcoal/80 dark:shadow-soft-dark dark:hover:border-accent-muted/35"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink group-hover:text-accent dark:text-sand dark:group-hover:text-accent-muted">
            {receipt.merchant}
          </p>
          <p className="mt-1 text-sm text-ink/50 dark:text-sand/55">
            {dateLabel}
            <span className="text-ink/30 dark:text-sand/35"> · </span>
            {receipt.items.length} item{receipt.items.length === 1 ? "" : "s"}
          </p>
        </div>
        <p className="shrink-0 rounded-lg bg-accent-soft px-2.5 py-1 text-sm font-semibold tabular-nums text-accent dark:bg-accent/20 dark:text-accent-muted">
          ₹{Number(receipt.total).toLocaleString("en-IN")}
        </p>
      </div>
    </Link>
  );
}
