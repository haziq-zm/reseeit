"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onFileReady: (file: File) => void;
};

/**
 * Mobile-first: camera capture + file/gallery pick with live preview.
 */
export function UploadCamera({ onFileReady }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  const setPreviewUrl = useCallback((url: string | null) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (url) previewUrlRef.current = url;
    setPreview(url);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setName(f.name);
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      onFileReady(f);
      e.target.value = "";
    },
    [onFileReady, setPreviewUrl]
  );

  const openPicker = (useCamera: boolean) => {
    const el = inputRef.current;
    if (!el) return;
    el.accept = "image/*";
    if (useCamera) el.setAttribute("capture", "environment");
    else el.removeAttribute("capture");
    el.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openPicker(true)}
          className="flex-1 min-w-[140px] rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-cream shadow hover:bg-charcoal active:scale-[0.98] dark:bg-sand dark:text-ink dark:hover:bg-wheat"
        >
          Use camera
        </button>
        <button
          type="button"
          onClick={() => openPicker(false)}
          className="flex-1 min-w-[140px] rounded-xl border border-wheat bg-cream px-4 py-3 text-sm font-semibold text-ink hover:bg-sand/60 dark:border-wheat/25 dark:bg-charcoal dark:text-sand dark:hover:bg-ink/80"
        >
          Choose file
        </button>
      </div>
      {preview && (
        <div className="overflow-hidden rounded-xl border border-wheat dark:border-wheat/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Receipt preview"
            className="max-h-72 w-full object-contain bg-sand/40 dark:bg-ink"
          />
          {name && (
            <p className="truncate px-3 py-2 text-xs text-ink/50 dark:text-sand/60">
              {name}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
