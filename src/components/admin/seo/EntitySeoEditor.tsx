"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { resetEntityMetaAction, updateEntityMetaAction } from "@/lib/seoActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import { SelectField, TextAreaField, TextField } from "@/components/admin/products/editor/FormField";
import { SerpPreview, SocialPreview } from "@/components/admin/seo/SeoPreviews";
import type { FormState } from "@/lib/actions";
import type { SeoEntityMeta, SeoEntityType } from "@/lib/data/seoEntityMeta";

const initialState: FormState = {};

export interface EntityTarget {
  type: SeoEntityType;
  key: string;
  label: string;
  path: string;
  /** What ships when no override is set — shown as placeholder text, not as a value. */
  defaultTitle: string;
  defaultDescription: string;
  /** Gated entities can't be indexed while the catalogue is private. */
  gated: boolean;
}

export interface EntityGroup {
  heading: string;
  blurb: string;
  targets: EntityTarget[];
}

export function EntitySeoEditor({
  groups,
  overrides,
  canEdit,
  commerceIndexable,
  initialKey,
}: {
  groups: EntityGroup[];
  overrides: Record<string, SeoEntityMeta>;
  canEdit: boolean;
  commerceIndexable: boolean;
  initialKey?: string;
}) {
  const allTargets = useMemo(() => groups.flatMap((group) => group.targets), [groups]);
  const [activeKey, setActiveKey] = useState(() => {
    const match = allTargets.find((target) => target.path === initialKey || target.key === initialKey);
    return match ? `${match.type}:${match.key}` : `${allTargets[0]?.type}:${allTargets[0]?.key}`;
  });

  const active = allTargets.find((target) => `${target.type}:${target.key}` === activeKey) ?? allTargets[0];
  if (!active) return <p className="text-sm text-ink-soft">Nothing to edit yet.</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <nav className="space-y-6" aria-label="SEO targets">
        {groups.map((group) => (
          <div key={group.heading}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{group.heading}</h2>
            <p className="mt-1 text-xs text-ink-soft">{group.blurb}</p>
            <ul className="mt-2 space-y-0.5">
              {group.targets.map((target) => {
                const key = `${target.type}:${target.key}`;
                const customised = Boolean(overrides[key]);
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setActiveKey(key)}
                      aria-current={key === activeKey ? "true" : undefined}
                      className={`flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-sm transition-colors ${
                        key === activeKey ? "bg-ink text-white" : "text-ink hover:bg-stone-100"
                      }`}
                    >
                      <span className="truncate">{target.label}</span>
                      {customised && (
                        <span
                          title="Has custom SEO"
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${key === activeKey ? "bg-white" : "bg-signal"}`}
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <EntityForm
        key={`${active.type}:${active.key}`}
        target={active}
        override={overrides[`${active.type}:${active.key}`]}
        canEdit={canEdit}
        commerceIndexable={commerceIndexable}
      />
    </div>
  );
}

function EntityForm({
  target,
  override,
  canEdit,
  commerceIndexable,
}: {
  target: EntityTarget;
  override?: SeoEntityMeta;
  canEdit: boolean;
  commerceIndexable: boolean;
}) {
  const action = updateEntityMetaAction.bind(null, target.type, target.key);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const showResult = useToastResult();
  useEffect(() => {
    if (state.error || state.success) showResult(state);
  }, [state, showResult]);

  // Live preview state. Falls back to the shipped default so the preview shows
  // what visitors will actually see, not an empty card.
  const [title, setTitle] = useState(override?.seoTitle ?? "");
  const [description, setDescription] = useState(override?.metaDescription ?? "");
  const [ogImage, setOgImage] = useState(override?.ogImageUrl ?? "");

  const effectiveTitle = title.trim() || target.defaultTitle;
  const effectiveDescription = description.trim() || target.defaultDescription;

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      <header className="border-b border-stone-300 pb-4">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">{target.label}</h2>
        <p className="mt-1 font-mono-tab text-xs text-ink-soft">{target.path}</p>
        {target.gated && !commerceIndexable && (
          <p className="mt-2 border border-stone-300 bg-stone-50 px-3 py-2 text-xs text-ink-soft">
            This page is behind the login and currently <strong>not indexed</strong> — the trade
            catalogue is private. These fields still control how the URL unfurls when a rep shares it.
          </p>
        )}
      </header>

      <div>
        <label htmlFor="seoTitle" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
          SEO title
        </label>
        <input
          id="seoTitle"
          name="seoTitle"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={target.defaultTitle}
          disabled={!canEdit}
          className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
        />
        <p className="mt-1 text-xs text-ink-soft">
          Leave blank to use the built-in default shown as placeholder text.
        </p>
      </div>

      <div>
        <label
          htmlFor="metaDescription"
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft"
        >
          Meta description
        </label>
        <textarea
          id="metaDescription"
          name="metaDescription"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={target.defaultDescription}
          disabled={!canEdit}
          className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
        />
      </div>

      <SerpPreview title={effectiveTitle} description={effectiveDescription} path={target.path} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Focus keyword" name="focusKeyword" defaultValue={override?.focusKeyword} disabled={!canEdit} />
        <TextField
          label="Secondary keywords (comma-separated)"
          name="secondaryKeywords"
          defaultValue={override?.secondaryKeywords.join(", ")}
          disabled={!canEdit}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Canonical URL"
          name="canonicalUrl"
          defaultValue={override?.canonicalUrl}
          disabled={!canEdit}
          placeholder={target.path}
        />
        <SelectField
          label="Robots"
          name="robots"
          defaultValue={override?.robots ?? "index,follow"}
          disabled={!canEdit}
          options={[
            { value: "index,follow", label: "Index, Follow" },
            { value: "noindex,follow", label: "No Index, Follow" },
            { value: "index,nofollow", label: "Index, No Follow" },
            { value: "noindex,nofollow", label: "No Index, No Follow" },
          ]}
        />
      </div>

      <fieldset className="space-y-4 border border-stone-300 bg-white p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Open Graph</legend>
        <TextField label="OG title" name="ogTitle" defaultValue={override?.ogTitle} disabled={!canEdit} placeholder={effectiveTitle} />
        <TextAreaField label="OG description" name="ogDescription" defaultValue={override?.ogDescription} rows={2} disabled={!canEdit} />
        <div>
          <label htmlFor="ogImageUrl" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            OG image URL
          </label>
          <input
            id="ogImageUrl"
            name="ogImageUrl"
            value={ogImage}
            onChange={(event) => setOgImage(event.target.value)}
            disabled={!canEdit}
            className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border border-stone-300 bg-white p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">X / Twitter</legend>
        <p className="text-xs text-ink-soft">Leave blank to reuse the Open Graph values.</p>
        <TextField label="Twitter title" name="twitterTitle" defaultValue={override?.twitterTitle} disabled={!canEdit} />
        <TextAreaField label="Twitter description" name="twitterDescription" defaultValue={override?.twitterDescription} rows={2} disabled={!canEdit} />
        <TextField label="Twitter image URL" name="twitterImageUrl" defaultValue={override?.twitterImageUrl} disabled={!canEdit} />
        <SelectField
          label="Card type"
          name="twitterCard"
          defaultValue={override?.twitterCard ?? "summary_large_image"}
          disabled={!canEdit}
          options={[
            { value: "summary_large_image", label: "Summary, large image" },
            { value: "summary", label: "Summary" },
          ]}
        />
      </fieldset>

      <SocialPreview
        network="Open Graph"
        title={override?.ogTitle || effectiveTitle}
        description={override?.ogDescription || effectiveDescription}
        imageUrl={ogImage || undefined}
      />

      {canEdit && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="border border-ink bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          {override && <ResetButton type={target.type} entityKey={target.key} label={target.label} />}
        </div>
      )}
    </form>
  );
}

function ResetButton({ type, entityKey, label }: { type: SeoEntityType; entityKey: string; label: string }) {
  return (
    <form
      action={resetEntityMetaAction.bind(null, type, entityKey)}
      onSubmit={(event) => {
        if (!window.confirm(`Clear the custom SEO for "${label}" and go back to the built-in defaults?`)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-xs text-ember underline underline-offset-2">
        Reset to defaults
      </button>
    </form>
  );
}
