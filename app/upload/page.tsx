"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { UploadCamera } from "@/components/UploadCamera";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFileReady = useCallback((f: File) => {
    setFile(f);
    setErr(null);
    setStatus(null);
  }, []);

  const submit = async () => {
    if (!file) {
      setErr("Choose or capture an image first.");
      return;
    }
    setBusy(true);
    setErr(null);
    setStatus("Uploading…");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const upJson = await up.json();
      if (!up.ok) throw new Error(upJson.error || "Upload failed");

      setStatus("Reading receipt & saving…");
      const proc = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: upJson.url }),
      });
      const procJson = await proc.json();
      if (!proc.ok) throw new Error(procJson.error || "Process failed");

      setStatus(procJson.usedMock ? "Saved (demo data — OCR was thin)." : "Saved!");
      if (procJson.receipt?.id) {
        router.push(`/receipt/${procJson.receipt.id}`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 font-[family-name:var(--font-geist-sans)]">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upload receipt</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Preview, then submit. We run OCR, parse line items, categorize, and store in Supabase.
        </p>
      </div>

      <UploadCamera onFileReady={onFileReady} />

      {err && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
          {err}
        </p>
      )}
      {status && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{status}</p>
      )}

      <button
        type="button"
        disabled={busy || !file}
        onClick={submit}
        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {busy ? "Working…" : "Submit receipt"}
      </button>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Tip: For a quick demo without readable text, the parser falls back to sample grocery + ride
        items.
      </p>
    </div>
  );
}
