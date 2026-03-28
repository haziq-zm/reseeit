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
        ? "Parsing (mock)…"
        : "Upload & preview parse";

  return (
    <div className="space-y-6 font-[family-name:var(--font-geist-sans)]">
      <div>
        <h1 className="text-2xl font-bold text-ink dark:text-sand">
          Upload receipt
        </h1>
        <p className="mt-1 text-sm text-ink/65 dark:text-sand/75">
          Upload an image, then we run a mock &quot;parse&quot; (no OCR) so you can build the UI.
        </p>
      </div>

      <UploadCamera onFileReady={onFileReady} />

      {err && (
        <p className="rounded-lg border border-wheat bg-sand/60 px-3 py-2 text-sm text-ink dark:border-wheat/30 dark:bg-ink/50 dark:text-sand">
          {err}
        </p>
      )}

      {result && (
        <div className="space-y-2 rounded-xl border border-wheat bg-sand/40 p-4 dark:border-wheat/25 dark:bg-ink/40">
          <p className="text-sm font-medium text-ink dark:text-sand">
            Uploaded successfully{result.mock ? " (mock storage)" : ""}
          </p>
          <dl className="space-y-1 text-xs text-ink/75 dark:text-sand/80">
            <div className="flex gap-2">
              <dt className="font-medium">Path:</dt>
              <dd className="truncate">{result.path}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium">URL:</dt>
              <dd className="truncate">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-wheat underline-offset-2 hover:opacity-80"
                >
                  {result.url}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      )}

      {parsed && (
        <div className="rounded-xl border border-wheat bg-cream p-4 shadow-sm dark:border-wheat/20 dark:bg-charcoal">
          <p className="mb-3 text-sm font-semibold text-ink dark:text-sand">
            Parsed receipt (mock)
          </p>
          <dl className="mb-4 space-y-1 text-sm text-ink/85 dark:text-sand">
            <div>
              <span className="font-medium text-ink/50 dark:text-sand/60">Merchant: </span>
              {parsed.merchant}
            </div>
            <div>
              <span className="font-medium text-ink/50 dark:text-sand/60">Date: </span>
              {parsed.date}
            </div>
            <div>
              <span className="font-medium text-ink/50 dark:text-sand/60">Total: </span>
              <span className="tabular-nums">₹{parsed.total}</span>
            </div>
          </dl>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/50 dark:text-sand/60">
            Items
          </p>
          <ul className="divide-y divide-wheat rounded-lg border border-wheat dark:divide-wheat/15 dark:border-wheat/15">
            {parsed.items.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-3 py-2 text-sm text-ink dark:text-sand"
              >
                <span>{item.name}</span>
                <span className="tabular-nums font-medium">₹{item.price}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        disabled={!file || busy}
        onClick={uploadAndProcess}
        className="w-full rounded-xl bg-ink py-3 text-sm font-semibold text-cream shadow hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sand dark:text-ink dark:hover:bg-wheat sm:w-auto sm:px-10"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
