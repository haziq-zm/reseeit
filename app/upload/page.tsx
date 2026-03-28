"use client";

import { useCallback, useState } from "react";
import { UploadCamera } from "@/components/UploadCamera";

interface UploadResult {
  path: string;
  url: string;
  mock?: boolean;
}

interface OcrResult {
  imageUrl: string;
  rawText: string;
  confidence: number;
  lowQuality: boolean;
  charCount: number;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"idle" | "uploading" | "ocr">("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onFileReady = useCallback((f: File) => {
    setFile(f);
    setErr(null);
    setResult(null);
    setOcr(null);
  }, []);

  const uploadAndExtract = async () => {
    if (!file) {
      setErr("Choose or capture an image first.");
      return;
    }

    setBusy(true);
    setErr(null);
    setResult(null);
    setOcr(null);

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

      setPhase("ocr");
      const procRes = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadData.url }),
      });
      const procJson = await procRes.json();

      if (!procRes.ok) {
        throw new Error(procJson.error || `OCR failed (${procRes.status})`);
      }

      const ocrData = procJson as OcrResult;
      setOcr(ocrData);
      console.log("[ocr] Extracted text:", ocrData.rawText.slice(0, 200));
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
      : phase === "ocr"
        ? "Running OCR…"
        : "Upload & extract text";

  return (
    <div className="space-y-8 font-[family-name:var(--font-geist-sans)]">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-sand">
          Upload receipt
        </h1>
        <p className="max-w-md text-[0.9375rem] leading-relaxed text-ink/60 dark:text-sand/65">
          Capture or select a receipt image. Tesseract.js will extract the raw
          text for you.
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
          <p className="mt-2 font-mono text-xs text-ink/40 dark:text-sand/45">
            {result.path}
          </p>
        </div>
      )}

      {ocr && (
        <div className="rounded-2xl border border-wheat/70 bg-gradient-to-br from-accent-soft/40 to-cream/90 p-5 shadow-soft dark:border-wheat/12 dark:from-accent/10 dark:to-charcoal/80 dark:shadow-soft-dark">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="label-min !mb-0">Extracted text</p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                ocr.lowQuality
                  ? "bg-clay/15 text-clay dark:bg-clay/20 dark:text-[#E8A89E]"
                  : ocr.confidence >= 70
                    ? "bg-sage/15 text-sage dark:bg-sage/25 dark:text-sand"
                    : "bg-honey/15 text-honey dark:bg-honey/25 dark:text-sand"
              }`}
            >
              {ocr.confidence}% confidence
            </span>
            <span className="text-xs tabular-nums text-ink/40 dark:text-sand/45">
              {ocr.charCount} chars
            </span>
          </div>

          {ocr.lowQuality && (
            <div className="mb-4 rounded-xl border border-honey/40 bg-honey/10 px-4 py-2.5 text-sm text-ink/70 dark:border-honey/20 dark:bg-honey/10 dark:text-sand/70">
              Low confidence — the image may be blurry, dark, or not a receipt.
              Try a clearer photo.
            </div>
          )}

          {ocr.rawText ? (
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-wheat/60 bg-cream/80 p-4 font-mono text-[0.8125rem] leading-relaxed text-ink/80 dark:border-wheat/10 dark:bg-ink/40 dark:text-sand/80">
              {ocr.rawText}
            </pre>
          ) : (
            <p className="text-sm italic text-ink/50 dark:text-sand/55">
              No text could be extracted from this image.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={!file || busy}
        onClick={uploadAndExtract}
        className="btn-primary w-full sm:w-auto"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
