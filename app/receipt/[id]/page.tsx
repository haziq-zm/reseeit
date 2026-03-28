"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ItemTable } from "@/components/ItemTable";
import type { ReceiptWithItems } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function ReceiptDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [suggestionsByItem, setSuggestionsByItem] = useState<Record<string, string[]>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["receipt", id],
    queryFn: () => fetchJson<{ receipt: ReceiptWithItems }>(`/api/receipts/${id}`),
    enabled: Boolean(id),
  });

  const receipt = data?.receipt;

  useEffect(() => {
    if (!receipt?.items.length) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/recommendations", { method: "POST" });
        const j = await res.json();
        if (cancelled || !j.alternatives) return;
        const map: Record<string, string[]> = {};
        for (const a of j.alternatives as { item: string; suggestions: string[] }[]) {
          map[a.item] = a.suggestions;
        }
        setSuggestionsByItem(map);
      } catch {
        /* optional enrichment */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [receipt?.id, receipt?.items.length]);

  const imageSrc = receipt?.image_url;
  const supabaseHost = useMemo(() => {
    try {
      return imageSrc ? new URL(imageSrc).hostname : "";
    } catch {
      return "";
    }
  }, [imageSrc]);

  if (isLoading) {
    return <p className="text-slate-600 dark:text-slate-400">Loading receipt…</p>;
  }
  if (error || !receipt) {
    return (
      <p className="text-rose-600 dark:text-rose-400">
        Could not load this receipt.{" "}
        <Link href="/" className="underline">
          Back home
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6 font-[family-name:var(--font-geist-sans)]">
      <Link
        href="/"
        className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
      >
        ← Dashboard
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {receipt.merchant}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {receipt.date} · Total ₹{Number(receipt.total).toLocaleString("en-IN")}
        </p>
      </div>

      {imageSrc && supabaseHost.endsWith("supabase.co") && (
        <div className="relative aspect-[3/4] max-h-80 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <Image
            src={imageSrc}
            alt="Receipt"
            fill
            className="object-contain bg-slate-100 dark:bg-slate-950"
            sizes="(max-width: 768px) 100vw, 640px"
          />
        </div>
      )}
      {imageSrc && !supabaseHost.endsWith("supabase.co") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt="Receipt"
          className="max-h-80 w-full rounded-xl border border-slate-200 object-contain dark:border-slate-800"
        />
      )}

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Items</h2>
        <ItemTable items={receipt.items} suggestionsByItem={suggestionsByItem} />
      </section>
    </div>
  );
}
