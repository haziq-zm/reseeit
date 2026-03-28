"use client";

import { useCallback, useState } from "react";
import { UploadCamera } from "@/components/UploadCamera";

interface UploadResult {
  path: string;
  url: string;
  mock?: boolean;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onFileReady = useCallback((f: File) => {
    setFile(f);
    setErr(null);
    setResult(null);
  }, []);

  const upload = async () => {
    if (!file) {
      setErr("Choose or capture an image first.");
      return;
    }

    setUploading(true);
    setErr(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `Upload failed (${res.status})`);
      }

      const data = json as UploadResult;
      setResult(data);
      console.log("[upload] Stored image URL:", data.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 font-[family-name:var(--font-geist-sans)]">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Upload receipt
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Capture with your camera or choose a file, preview it, then upload to
          storage.
        </p>
      </div>

      <UploadCamera onFileReady={onFileReady} />

      {err && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
          {err}
        </p>
      )}

      {result && (
        <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Uploaded successfully{result.mock ? " (mock storage)" : ""}
          </p>
          <dl className="space-y-1 text-xs text-emerald-700 dark:text-emerald-300">
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
                  className="underline hover:text-emerald-500"
                >
                  {result.url}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      )}

      <button
        type="button"
        disabled={!file || uploading}
        onClick={upload}
        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {uploading ? "Uploading…" : "Upload receipt"}
      </button>
    </div>
  );
}
