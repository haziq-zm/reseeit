"use client";

import { useCallback, useState } from "react";
import { UploadCamera } from "@/components/UploadCamera";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onFileReady = useCallback((f: File) => {
    setFile(f);
    setErr(null);
    setInfo(null);
  }, []);

  const logFile = () => {
    if (!file) {
      setErr("Choose or capture an image first.");
      return;
    }
    setErr(null);
    // Dev-only visibility: open DevTools → Console to inspect the File.
    console.log("[upload] File object:", file);
    console.log("[upload] Metadata:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });
    setInfo("Logged to the browser console (open DevTools → Console).");
  };

  return (
    <div className="space-y-6 font-[family-name:var(--font-geist-sans)]">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upload receipt</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Capture with your camera or choose a file, preview it, then log it to the console. OCR is not
          wired up yet.
        </p>
      </div>

      <UploadCamera onFileReady={onFileReady} />

      {err && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
          {err}
        </p>
      )}
      {info && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{info}</p>
      )}

      <button
        type="button"
        disabled={!file}
        onClick={logFile}
        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-10"
      >
        Log file to console
      </button>
    </div>
  );
}
