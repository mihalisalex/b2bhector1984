"use client";

import { useActionState, useEffect, useState } from "react";
import { updateSeoAction } from "@/lib/journalActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import { generateArticleDescription, generateArticleTitle, gradeLength, DESCRIPTION_MAX, TITLE_MAX } from "@/lib/seoAutogen";
import type { FormState } from "@/lib/actions";
import type { JournalPost } from "@/lib/types";

const initialState: FormState = {};

export function SeoTab({ post, siteName }: { post: JournalPost; siteName: string }) {
  const [state, formAction, isPending] = useActionState(updateSeoAction.bind(null, post.id, post.slug), initialState);
  const showResult = useToastResult();

  const generatedTitle = generateArticleTitle({ title: post.title, excerpt: post.excerpt, contentHtml: post.contentHtml, category: post.category, siteName });
  const generatedDescription = generateArticleDescription({ title: post.title, excerpt: post.excerpt, contentHtml: post.contentHtml, category: post.category, siteName });

  const [title, setTitle] = useState(post.seoTitle || "");
  const [description, setDescription] = useState(post.metaDescription || "");

  useEffect(() => {
    if (state.error || state.success) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const previewTitle = title.trim() || generatedTitle;
  const previewDescription = description.trim() || generatedDescription;

  return (
    <form action={formAction} className="max-w-xl space-y-5 pb-20">
      <div className="border border-stone-300 bg-stone-100 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Live SERP preview</span>
        <div className="mt-2 border border-stone-300 bg-white p-3">
          <p className="truncate text-[13px] text-court">hectorfootwear.gr › journal › {post.slug}</p>
          <p className="mt-0.5 truncate text-lg text-signal">{previewTitle}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{previewDescription}</p>
        </div>
      </div>

      <Field label="SEO title" hint={`Blank uses the generated title: "${generatedTitle}"`} grade={gradeLength(title || generatedTitle, 1, TITLE_MAX)}>
        <input name="seoTitle" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink" />
      </Field>

      <Field
        label="Meta description"
        hint={`Blank uses the generated description.`}
        grade={gradeLength(description || generatedDescription, 1, DESCRIPTION_MAX)}
      >
        <textarea name="metaDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink" />
      </Field>

      <Field label="Open Graph image URL" hint="Blank falls back to the featured image.">
        <input name="ogImageUrl" defaultValue={post.ogImageUrl} className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink" />
      </Field>

      <Field label="Canonical URL" hint={`Blank uses /journal/${post.slug}`}>
        <input name="canonicalUrl" defaultValue={post.canonicalUrl} placeholder={`/journal/${post.slug}`} className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink" />
      </Field>

      <Field label="Robots" hint="e.g. index,follow or noindex,nofollow">
        <input name="robots" defaultValue={post.robots} className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-ink" />
      </Field>

      <button type="submit" disabled={isPending} className="border border-ink bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50">
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function Field({ label, hint, grade, children }: { label: string; hint?: string; grade?: "good" | "warn" | "bad"; children: React.ReactNode }) {
  const gradeColor = grade === "good" ? "text-positive" : grade === "warn" ? "text-court" : "text-ink-soft";
  return (
    <label className="block">
      <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {label}
        {grade && <span className={gradeColor}>{grade}</span>}
      </span>
      {hint && <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-ink-soft/70">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
