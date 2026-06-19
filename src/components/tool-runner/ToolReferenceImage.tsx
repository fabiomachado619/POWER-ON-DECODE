"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/LocaleProvider";

interface ToolReferenceImageProps {
  src: string;
  alt: string;
  caption?: string;
}

export function ToolReferenceImage({
  src,
  alt,
  caption,
}: ToolReferenceImageProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <figure className="mb-6">
        {caption && (
          <figcaption className="mb-3 text-center text-sm text-ink-muted">
            {caption}
          </figcaption>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group mx-auto block w-full max-w-xl rounded-2xl border border-divider bg-surface p-3 shadow-elevated transition hover:border-brand/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label={t.tool.enlargeReferenceImage}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="mx-auto max-h-80 w-full object-contain"
          />
          <span className="mt-2 block text-center text-xs text-ink-muted group-hover:text-brand-dark">
            {t.tool.clickToEnlarge}
          </span>
        </button>
      </figure>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75"
            onClick={() => setOpen(false)}
            aria-label={t.tool.closeImage}
          />
          <div className="relative z-10 w-full max-w-5xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -right-1 -top-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-2xl leading-none text-white transition hover:bg-black/80 sm:-right-3 sm:-top-3"
              aria-label={t.tool.closeImage}
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-h-[85vh] w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
