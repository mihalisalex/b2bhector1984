"use client";

import { useRef, useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { UploadState, UploadTarget } from "@/lib/adminActions";

/**
 * Uploads straight from the browser to Supabase Storage using a signed URL
 * minted server-side, instead of routing the file through a Server Action —
 * Vercel's serverless functions cap request bodies well under what a real
 * camera/phone photo needs, which a plain <form action={...}> upload hits.
 */
export function ImageUploadForm({
  createUploadTarget,
  finalizeUpload,
  buttonLabel,
}: {
  createUploadTarget: (fileName: string) => Promise<UploadTarget>;
  finalizeUpload: (path: string) => Promise<UploadState>;
  buttonLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      setError("Choose a file first.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const target = await createUploadTarget(file.name);
      if ("error" in target) {
        setError(target.error);
        return;
      }

      const { error: uploadError } = await supabaseBrowser.storage
        .from(target.bucket)
        .uploadToSignedUrl(target.path, target.token, file, {
          contentType: file.type || "application/octet-stream",
        });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const result = await finalizeUpload(target.path);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-center gap-3">
      <input
        type="file"
        name="file"
        accept="image/*"
        required
        className="text-sm text-ink-soft file:mr-3 file:border file:border-stone-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-ink"
      />
      <button
        type="submit"
        disabled={pending}
        className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Uploading…" : buttonLabel}
      </button>
      {error && (
        <p role="alert" className="w-full border border-ember/40 bg-ember-100 px-3 py-2 text-xs text-ember">
          {error}
        </p>
      )}
    </form>
  );
}
