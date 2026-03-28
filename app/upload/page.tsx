"use client";

import { useCallback, useState } from "react";
import { UploadCamera } from "@/components/UploadCamera";

interface UploadResult {
  path: string;
  url: string;
  mock?: boolean;
}

interface ParsedItem {
  name: string;
  price: number;
}

interface ParsedReceipt {
  merchant: string;
  date: string;
  items: ParsedItem[];
  total: number;
}

interface ProcessResult {
  parsed: ParsedReceipt;
  imageUrl: string;
  mock?: boolean;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"idle" | "uploading" | "processing">("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onFileReady = useCallback((f: File) => {
    setFile(f);
    setErr(null);
    setResult(null);
    setParsed(null);
  }, []);

  const uploadAndProcess = async () => {
    if (!file) {
      setErr("Choose or capture an image first.");
      return;
    }

    setBusy(true);
    setErr(null);
    setResult(null);
    setParsed(null);

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
      console.log("[upload] Stored image URL:", uploadData.url);

      setPhase("processing");
      const procRes = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadData.url }),
      });
      const procJson = await procRes.json();

      if (!procRes.ok) {
        throw new Error(procJson.error || `Process failed (${procRes.status})`);
      }

      const processData = procJson as ProcessResult;
      setParsed(processData.parsed);
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
        ? "Parsing…"
        : "Upload & parse receipt";

  return (
    <div className="space-y-8 font-[family-name:var(--font-geist-sans)]">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-sand">
          Upload receipt
        </h1>
        <p className="max-w-md text-[0.9375rem] leading-relaxed text-ink/60 dark:text-sand/65">
          Capture or select an image. It will be stored securely; parsing below uses sample data until
          OCR is enabled.
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

      {result && (
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
          <p className="mt-2 font-mono text-xs text-ink/40 dark:text-sand/45">{result.path}</p>
        </div>
      )}

      {parsed && (
        <div className="rounded-2xl border border-wheat/70 bg-gradient-to-br from-accent-soft/40 to-cream/90 p-5 shadow-soft dark:border-wheat/12 dark:from-accent/10 dark:to-charcoal/80 dark:shadow-soft-dark">
          <p className="label-min mb-4">Parsed preview (mock)</p>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-ink/45 dark:text-sand/50">Merchant</dt>
              <dd className="mt-1 font-semibold text-ink dark:text-sand">{parsed.merchant}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-ink/45 dark:text-sand/50">Date</dt>
              <dd className="mt-1 text-ink dark:text-sand">{parsed.date}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-ink/45 dark:text-sand/50">Total</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-accent dark:text-accent-muted">
                ₹{parsed.total}
              </dd>
            </div>
          </dl>
          <p className="label-min mb-3 mt-8">Line items</p>
          <ul className="divide-y divide-wheat/70 rounded-xl border border-wheat/60 bg-cream/80 dark:divide-wheat/10 dark:border-wheat/10 dark:bg-ink/40">
            {parsed.items.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="text-ink dark:text-sand">{item.name}</span>
                <span className="font-medium tabular-nums text-accent dark:text-accent-muted">
                  ₹{item.price}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        disabled={!file || busy}
        onClick={uploadAndProcess}
        className="btn-primary w-full sm:w-auto"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
