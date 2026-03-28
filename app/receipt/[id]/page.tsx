"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { InsightsPanel } from "@/components/InsightsPanel";
import { ItemTable } from "@/components/ItemTable";
import type { AlternativeBlock, Insight, ReceiptWithItems } from "@/lib/types";
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
  const [insights, setInsights] = useState<Insight[]>([]);
  const [alternatives, setAlternatives] = useState<AlternativeBlock[]>([]);
  const [recLoading, setRecLoading] = useState(true);

  const { data, isLoading, error } = useQuery({
    queryKey: ["receipt", id],
    queryFn: () => fetchJson<{ receipt: ReceiptWithItems }>(`/api/receipts/${id}`),
    enabled: Boolean(id),
  });

  const receipt = data?.receipt;

  useEffect(() => {
    if (!receipt?.items.length) return;
    let cancelled = false;
    setRecLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/recommendations", { method: "POST" });
        const j = await res.json();
        if (cancelled) return;

        setInsights(j.insights ?? []);
        setAlternatives(j.alternatives ?? []);

        const map: Record<string, string[]> = {};
        for (const a of (j.alternatives ?? []) as AlternativeBlock[]) {
          map[a.item] = a.suggestions;
        }
        setSuggestionsByItem(map);
      } catch {
        /* optional enrichment */
      } finally {
        if (!cancelled) setRecLoading(false);
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
    return (
      <p className="rounded-xl border border-dashed border-wheat/80 py-12 text-center text-sm text-ink/50 dark:border-wheat/15 dark:text-sand/55">
        Loading receipt…
      </p>
    );
  }
  if (error || !receipt) {
    return (
      <div className="rounded-2xl border border-wheat/70 bg-cream/70 p-6 text-center dark:border-wheat/12 dark:bg-charcoal/70">
        <p className="text-sm leading-relaxed text-ink dark:text-sand">
          We couldn&apos;t load this receipt.
        </p>
        <Link href="/" className="btn-primary mt-4 inline-flex">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-[family-name:var(--font-geist-sans)]">
      <Link
        href="/"
        className="inline-flex text-sm font-medium text-accent transition-colors hover:text-accent-hover dark:text-accent-muted dark:hover:text-sand"
      >
        ← Back to dashboard
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-sand">
          {receipt.merchant}
        </h1>
        <p className="text-[0.9375rem] text-ink/55 dark:text-sand/60">
          {receipt.date}
          <span className="mx-2 text-ink/25 dark:text-sand/25">·</span>
          Total{" "}
          <span className="font-semibold tabular-nums text-accent dark:text-accent-muted">
            ₹{Number(receipt.total).toLocaleString("en-IN")}
          </span>
        </p>
      </header>

      {imageSrc && supabaseHost.endsWith("supabase.co") && (
        <div className="overflow-hidden rounded-2xl border border-wheat/70 bg-cream shadow-soft dark:border-wheat/12 dark:bg-charcoal/80 dark:shadow-soft-dark">
          <div className="relative aspect-[3/4] max-h-80 w-full">
            <Image
              src={imageSrc}
              alt="Receipt"
              fill
              className="object-contain object-left-top"
              sizes="(max-width: 768px) 100vw, 512px"
            />
          </div>
        </div>
      )}
      {imageSrc && !supabaseHost.endsWith("supabase.co") && (
        <div className="overflow-hidden rounded-2xl border border-wheat/70 shadow-soft dark:border-wheat/12 dark:shadow-soft-dark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt="Receipt"
            className="max-h-80 w-full object-contain object-left-top"
          />
        </div>
      )}

      <section className="rounded-2xl border border-wheat/70 bg-cream/70 p-5 shadow-soft dark:border-wheat/12 dark:bg-charcoal/70 dark:shadow-soft-dark">
        <h2 className="label-min mb-5">Line items</h2>
        <ItemTable items={receipt.items} suggestionsByItem={suggestionsByItem} />
      </section>

      <section className="rounded-2xl border border-wheat/70 bg-cream/70 p-5 shadow-soft dark:border-wheat/12 dark:bg-charcoal/70 dark:shadow-soft-dark">
        <h2 className="label-min mb-4">Insights & savings</h2>
        <InsightsPanel
          insights={insights}
          alternatives={alternatives}
          loading={recLoading}
        />
      </section>
    </div>
  );
}
