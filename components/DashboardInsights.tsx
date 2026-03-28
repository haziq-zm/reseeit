"use client";

import { useEffect, useState } from "react";
import { InsightsPanel } from "./InsightsPanel";
import type { AlternativeBlock, Insight } from "@/lib/types";

interface RecommendationsResponse {
  insights: Insight[];
  alternatives: AlternativeBlock[];
}

export function DashboardInsights() {
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/recommendations", { method: "POST" });
        if (!res.ok) throw new Error(`${res.status}`);
        const json = (await res.json()) as RecommendationsResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData({ insights: [], alternatives: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <InsightsPanel
      insights={data?.insights ?? []}
      alternatives={data?.alternatives ?? []}
      loading={loading}
    />
  );
}
