"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { UploadCamera } from "@/components/UploadCamera";

interface UploadResult {
  path: string;
  url: string;
  mock?: boolean;
}

interface SavedItem {
  id: string;
  receipt_id: string;
  name: string;
  category: string;
  price: number;
  quantity: number | null;
}

interface SavedReceipt {
  id: string;
  user_id: string;
  merchant: string;
  date: string;
  total: number;
  image_url: string | null;
  created_at: string;
  items: SavedItem[];
}

interface ProcessResult {
  receipt: SavedReceipt;
  rawText: string;
  confidence: number;
  lowQuality: boolean;
  charCount: number;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<
    "idle" | "uploading" | "processing"
  >("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(
    null
  );
  const [showRaw, setShowRaw] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onFileReady = useCallback((f: File) => {
    setFile(f);
    setErr(null);
    setResult(null);
    setProcessResult(null);
    setShowRaw(false);
  }, []);

  const uploadAndProcess = async () => {
    if (!file) {
      setErr("Choose or capture an image first.");
      return;
    }

    setBusy(true);
    setErr(null);
    setResult(null);
    setProcessResult(null);
    setShowRaw(false);

    try {
      setPhase("uploading");
      const fd = new FormData();
      fd.append("file", file);

      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      const upJson = await upRes.json();

      if (!upRes.ok) {
        throw new Error(upJson.error || `Upload failed (${upRes.status})`);
      }

      const uploadData = upJson as UploadResult;
      setResult(uploadData);

      setPhase("processing");
      const procRes = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadData.url }),
      });
      const procJson = await procRes.json();

      if (!procRes.ok) {
        throw new Error(
          procJson.error || `Processing failed (${procRes.status})`
        );
      }

      setProcessResult(procJson as ProcessResult);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
      setPhase("idle");
    }
  };

  const buttonLabel =
    phase === "uploading"
      ? "Uploading…"
      : phase === "processing"
        ? "Processing…"
        : "Upload & parse receipt";

  const receipt = processResult?.receipt;

  return (
    <div className="space-y-8 font-[family-name:var(--font-geist-sans)]">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-sand">
          Upload receipt
        </h1>
        <p className="max-w-md text-[0.9375rem] leading-relaxed text-ink/60 dark:text-sand/65">
          Capture or select a receipt image. We&apos;ll extract, parse, and
          save it automatically.
        </p>
      </header>

      <div className="rounded-2xl border border-wheat/70 bg-cream/70 p-5 shadow-soft dark:border-wheat/12 dark:bg-charcoal/70 dark:shadow-soft-dark">
        <p className="label-min mb-4">Image</p>
        <UploadCamera onFileReady={onFileReady} />
      </div>

      {err && (
        <div
          className="rounded-2xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm leading-relaxed text-ink dark:border-clay/25 dark:bg-clay/15 dark:text-sand"
          role="alert"
        >
          {err}
        </div>
      )}

      {result && !receipt && (
        <div className="rounded-2xl border border-wheat/70 bg-cream/70 p-5 shadow-soft dark:border-wheat/12 dark:bg-charcoal/70 dark:shadow-soft-dark">
          <p className="label-min mb-3">Stored image</p>
          <p className="text-sm leading-relaxed text-ink/65 dark:text-sand/70">
            {result.mock && (
              <span className="mr-2 inline-block rounded-md bg-honey/25 px-2 py-0.5 text-xs font-medium text-ink dark:text-sand">
                Demo storage
              </span>
            )}
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-medium text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent dark:text-accent-muted"
            >
              {result.url}
            </a>
          </p>
        </div>
      )}

      {receipt && processResult && (
        <div className="space-y-6">
          {/* OCR confidence + saved confirmation */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-sage/15 px-2.5 py-0.5 text-xs font-medium text-sage dark:bg-sage/25 dark:text-sand">
              Saved
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                processResult.lowQuality
                  ? "bg-clay/15 text-clay dark:bg-clay/20 dark:text-[#E8A89E]"
                  : processResult.confidence >= 70
                    ? "bg-sage/15 text-sage dark:bg-sage/25 dark:text-sand"
                    : "bg-honey/15 text-honey dark:bg-honey/25 dark:text-sand"
              }`}
            >
              {processResult.confidence}% OCR confidence
            </span>
            <span className="text-xs tabular-nums text-ink/40 dark:text-sand/45">
              {processResult.charCount} chars
            </span>
          </div>

          {processResult.lowQuality && (
            <div className="rounded-xl border border-honey/40 bg-honey/10 px-4 py-2.5 text-sm text-ink/70 dark:border-honey/20 dark:bg-honey/10 dark:text-sand/70">
              Low OCR confidence — parsed results may be inaccurate. Try a
              clearer photo for better accuracy.
            </div>
          )}

          {/* Saved receipt card */}
          <div className="rounded-2xl border border-wheat/70 bg-gradient-to-br from-accent-soft/40 to-cream/90 p-5 shadow-soft dark:border-wheat/12 dark:from-accent/10 dark:to-charcoal/80 dark:shadow-soft-dark">
            <p className="label-min mb-4">Parsed receipt</p>

            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-ink/45 dark:text-sand/50">
                  Merchant
                </dt>
                <dd className="mt-1 font-semibold text-ink dark:text-sand">
                  {receipt.merchant}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink/45 dark:text-sand/50">
                  Date
                </dt>
                <dd className="mt-1 text-ink dark:text-sand">
                  {receipt.date}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink/45 dark:text-sand/50">
                  Total
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-accent dark:text-accent-muted">
                  ₹{Number(receipt.total).toLocaleString("en-IN")}
                </dd>
              </div>
            </dl>

            <p className="label-min mb-3 mt-8">
              Items ({receipt.items.length})
            </p>
            <ul className="divide-y divide-wheat/70 rounded-xl border border-wheat/60 bg-cream/80 dark:divide-wheat/10 dark:border-wheat/10 dark:bg-ink/40">
              {receipt.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <span className="text-ink dark:text-sand">
                    {item.name}
                    {item.quantity && item.quantity > 1 && (
                      <span className="ml-1.5 text-xs text-ink/40 dark:text-sand/45">
                        ×{item.quantity}
                      </span>
                    )}
                    <span className="ml-2 rounded-md bg-wheat/40 px-1.5 py-0.5 text-[0.6875rem] text-ink/50 dark:bg-wheat/10 dark:text-sand/50">
                      {item.category}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-accent dark:text-accent-muted">
                    ₹{Number(item.price).toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Raw OCR text — collapsible */}
          <div className="rounded-2xl border border-wheat/70 bg-cream/70 p-5 shadow-soft dark:border-wheat/12 dark:bg-charcoal/70 dark:shadow-soft-dark">
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className="flex w-full items-center justify-between text-left"
            >
              <p className="label-min !mb-0">Raw OCR text</p>
              <span className="text-xs text-ink/40 dark:text-sand/45">
                {showRaw ? "Hide" : "Show"}
              </span>
            </button>

            {showRaw && (
              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-wheat/60 bg-cream/80 p-4 font-mono text-[0.8125rem] leading-relaxed text-ink/80 dark:border-wheat/10 dark:bg-ink/40 dark:text-sand/80">
                {processResult.rawText || "(empty)"}
              </pre>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/receipt/${receipt.id}`}
              className="btn-primary inline-flex"
            >
              View receipt
            </Link>
            <Link href="/" className="btn-secondary inline-flex">
              Back to dashboard
            </Link>
          </div>
        </div>
      )}

      {!receipt && (
        <button
          type="button"
          disabled={!file || busy}
          onClick={uploadAndProcess}
          className="btn-primary w-full sm:w-auto"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}
