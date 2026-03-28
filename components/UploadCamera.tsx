"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onFileReady: (file: File) => void;
};

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
    <div className="space-y-5">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => openPicker(true)}
          className="btn-primary min-h-[44px] flex-1 sm:flex-none"
        >
          Take photo
        </button>
        <button
          type="button"
          onClick={() => openPicker(false)}
          className="btn-secondary min-h-[44px] flex-1 sm:flex-none"
        >
          Choose from library
        </button>
      </div>
      {preview && (
        <div className="overflow-hidden rounded-2xl border border-wheat/70 bg-cream shadow-soft dark:border-wheat/12 dark:bg-charcoal/80 dark:shadow-soft-dark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Receipt preview"
            className="max-h-72 w-full object-contain"
          />
          {name && (
            <p className="border-t border-wheat/50 px-4 py-2.5 text-sm text-ink/50 dark:border-wheat/10 dark:text-sand/55">
              {name}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
