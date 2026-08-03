"use client";

import { useActionState, useEffect, useState } from "react";
import { updateSeoSettingsAction } from "@/lib/seoActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/admin/products/editor/FormField";
import { SerpPreview } from "@/components/admin/seo/SeoPreviews";
import type { FormState } from "@/lib/actions";
import type { SeoSettings } from "@/lib/data/seoSettings";

const initialState: FormState = {};

type Section = "general" | "indexing" | "organization" | "schema";

const SECTIONS: { id: Section; label: string; blurb: string }[] = [
  { id: "general", label: "Defaults & social", blurb: "The title, description and share card used wherever a page doesn't set its own." },
  { id: "indexing", label: "Indexing & robots", blurb: "What search engines are allowed to crawl and index." },
  { id: "organization", label: "Organization", blurb: "Business identity — feeds the Organization / LocalBusiness structured data." },
  { id: "schema", label: "Structured data", blurb: "Which JSON-LD types this site emits." },
];

export function SeoSettingsForm({
  settings,
  canEdit,
  initialSection = "general",
}: {
  settings: SeoSettings;
  canEdit: boolean;
  initialSection?: Section;
}) {
  const [section, setSection] = useState<Section>(initialSection);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            aria-pressed={section === item.id}
            className={`border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              section === item.id
                ? "border-ink bg-ink text-white"
                : "border-stone-300 bg-white text-ink-soft hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-ink-soft">{SECTIONS.find((s) => s.id === section)!.blurb}</p>

      {/* Each section is its own form with its own `section` marker, so saving
          one never submits (and therefore never blanks) another's fields. */}
      {section === "general" && <GeneralSection settings={settings} canEdit={canEdit} />}
      {section === "indexing" && <IndexingSection settings={settings} canEdit={canEdit} />}
      {section === "organization" && <OrganizationSection settings={settings} canEdit={canEdit} />}
      {section === "schema" && <SchemaSection settings={settings} canEdit={canEdit} />}
    </div>
  );
}

function useSeoForm() {
  const [state, formAction, isPending] = useActionState(updateSeoSettingsAction, initialState);
  const showResult = useToastResult();
  useEffect(() => {
    if (state.error || state.success) showResult(state);
  }, [state, showResult]);
  return { formAction, isPending };
}

function SaveButton({ isPending, canEdit }: { isPending: boolean; canEdit: boolean }) {
  if (!canEdit) {
    return <p className="text-xs text-ink-soft">Your role can view these settings but not change them.</p>;
  }
  return (
    <button
      type="submit"
      disabled={isPending}
      className="border border-ink bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
    >
      {isPending ? "Saving…" : "Save changes"}
    </button>
  );
}

function GeneralSection({ settings, canEdit }: { settings: SeoSettings; canEdit: boolean }) {
  const { formAction, isPending } = useSeoForm();
  const [title, setTitle] = useState(settings.defaultTitle);
  const [description, setDescription] = useState(settings.defaultDescription);

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      <input type="hidden" name="section" value="general" />

      <TextField label="Site name" name="siteName" defaultValue={settings.siteName} disabled={!canEdit} />
      <div>
        <TextField
          label="Title template"
          name="titleTemplate"
          defaultValue={settings.titleTemplate}
          disabled={!canEdit}
          placeholder="%s — Hector Footwear Wholesale"
        />
        <p className="mt-1 text-xs text-ink-soft">
          <code className="font-mono-tab">%s</code> is replaced by each page&rsquo;s own title. The homepage
          opts out so its title doesn&rsquo;t read &ldquo;… Wholesale — … Wholesale&rdquo;.
        </p>
      </div>

      <div>
        <label htmlFor="defaultTitle" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Default title
        </label>
        <input
          id="defaultTitle"
          name="defaultTitle"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={!canEdit}
          className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
        />
      </div>

      <div>
        <label
          htmlFor="defaultDescription"
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft"
        >
          Default meta description
        </label>
        <textarea
          id="defaultDescription"
          name="defaultDescription"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={!canEdit}
          className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
        />
      </div>

      <SerpPreview title={title} description={description} path="/" />

      <TextField
        label="Default share image URL"
        name="defaultOgImageUrl"
        defaultValue={settings.defaultOgImageUrl}
        disabled={!canEdit}
        placeholder="https://… (1200×630 works best)"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="X / Twitter site handle" name="twitterSite" defaultValue={settings.twitterSite} disabled={!canEdit} placeholder="@hectorfootwear" />
        <TextField label="X / Twitter creator handle" name="twitterCreator" defaultValue={settings.twitterCreator} disabled={!canEdit} placeholder="@hectorfootwear" />
      </div>

      <SelectField
        label="Default card type"
        name="defaultTwitterCard"
        defaultValue={settings.defaultTwitterCard}
        disabled={!canEdit}
        options={[
          { value: "summary_large_image", label: "Summary, large image" },
          { value: "summary", label: "Summary" },
        ]}
      />

      <fieldset className="border border-stone-300 bg-white p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Search engine verification
        </legend>
        <p className="mb-3 text-xs text-ink-soft">
          Paste the content value from the verification meta tag. These render in every page&rsquo;s head.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Google Search Console" name="googleSiteVerification" defaultValue={settings.googleSiteVerification} disabled={!canEdit} />
          <TextField label="Bing Webmaster Tools" name="bingSiteVerification" defaultValue={settings.bingSiteVerification} disabled={!canEdit} />
        </div>
      </fieldset>

      <SaveButton isPending={isPending} canEdit={canEdit} />
    </form>
  );
}

function IndexingSection({ settings, canEdit }: { settings: SeoSettings; canEdit: boolean }) {
  const { formAction, isPending } = useSeoForm();
  const [indexable, setIndexable] = useState(settings.commerceIndexable);

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      <input type="hidden" name="section" value="indexing" />

      <fieldset className="border border-stone-300 bg-white p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Trade catalogue visibility
        </legend>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            name="commerceIndexable"
            checked={indexable}
            onChange={(event) => setIndexable(event.target.checked)}
            disabled={!canEdit}
            className="mt-0.5 h-4 w-4 accent-ink"
          />
          <span>
            Allow search engines to index the catalogue and product pages
            <span className="mt-1 block text-xs text-ink-soft">
              Off by default. This one switch controls robots.txt, the sitemap and every product
              page&rsquo;s robots tag together, so they can never contradict each other.
            </span>
          </span>
        </label>

        {indexable && (
          <p className="mt-3 border border-ember bg-ember/5 px-3 py-2 text-xs text-ink">
            <strong>Wholesale prices become publicly visible in search results.</strong> Product pages
            are still behind the login for humans, but you are asking Google to crawl and list them.
            Only do this if the business has decided to open the catalogue up.
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-3 border border-stone-300 bg-white p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Crawling</legend>
        <CheckboxField
          label="Serve robots.txt normally (uncheck to block all crawlers — staging only)"
          name="robotsEnabled"
          defaultChecked={settings.robotsEnabled}
          disabled={!canEdit}
        />
        <CheckboxField label="Publish an XML sitemap" name="sitemapEnabled" defaultChecked={settings.sitemapEnabled} disabled={!canEdit} />
        <CheckboxField
          label="Include product images in the sitemap"
          name="sitemapIncludeImages"
          defaultChecked={settings.sitemapIncludeImages}
          disabled={!canEdit}
        />
        <TextField
          label="Crawl delay (seconds, blank for none)"
          name="crawlDelay"
          type="number"
          defaultValue={settings.crawlDelay}
          disabled={!canEdit}
        />
      </fieldset>

      <TextAreaField
        label="Extra disallowed paths (one per line)"
        name="extraDisallow"
        defaultValue={settings.extraDisallow.join("\n")}
        rows={4}
        disabled={!canEdit}
      />
      <TextAreaField
        label="Extra allowed paths (one per line)"
        name="extraAllow"
        defaultValue={settings.extraAllow.join("\n")}
        rows={3}
        disabled={!canEdit}
      />

      <SaveButton isPending={isPending} canEdit={canEdit} />
    </form>
  );
}

function OrganizationSection({ settings, canEdit }: { settings: SeoSettings; canEdit: boolean }) {
  const { formAction, isPending } = useSeoForm();

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      <input type="hidden" name="section" value="organization" />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Legal name" name="organizationLegalName" defaultValue={settings.organizationLegalName} disabled={!canEdit} />
        <TextField label="Founded (year)" name="organizationFoundingYear" defaultValue={settings.organizationFoundingYear} disabled={!canEdit} placeholder="1984" />
      </div>
      <TextField label="Logo URL" name="organizationLogoUrl" defaultValue={settings.organizationLogoUrl} disabled={!canEdit} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Contact email" name="organizationEmail" type="email" defaultValue={settings.organizationEmail} disabled={!canEdit} />
        <TextField label="Contact phone" name="organizationPhone" defaultValue={settings.organizationPhone} disabled={!canEdit} />
      </div>

      <fieldset className="space-y-4 border border-stone-300 bg-white p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Address</legend>
        <TextField label="Street" name="organizationStreet" defaultValue={settings.organizationStreet} disabled={!canEdit} />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="City" name="organizationCity" defaultValue={settings.organizationCity} disabled={!canEdit} />
          <TextField label="Region" name="organizationRegion" defaultValue={settings.organizationRegion} disabled={!canEdit} />
          <TextField label="Postal code" name="organizationPostalCode" defaultValue={settings.organizationPostalCode} disabled={!canEdit} />
        </div>
        <TextField label="Country code" name="organizationCountry" defaultValue={settings.organizationCountry} disabled={!canEdit} placeholder="GR" />
      </fieldset>

      <TextAreaField
        label="Social profile URLs (one per line)"
        name="socialProfiles"
        defaultValue={settings.socialProfiles.join("\n")}
        rows={4}
        disabled={!canEdit}
      />
      <p className="-mt-3 text-xs text-ink-soft">
        These become the <code className="font-mono-tab">sameAs</code> array, which is how Google links
        this site to the brand&rsquo;s social accounts.
      </p>

      <fieldset className="space-y-3 border border-stone-300 bg-white p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Local business</legend>
        <CheckboxField
          label="Publish as a LocalBusiness (only if there's a real showroom or trade counter)"
          name="localBusinessEnabled"
          defaultChecked={settings.localBusinessEnabled}
          disabled={!canEdit}
        />
        <TextField
          label="Opening hours"
          name="openingHours"
          defaultValue={settings.openingHours}
          disabled={!canEdit}
          placeholder="Mo-Fr 09:00-17:00"
        />
      </fieldset>

      <SaveButton isPending={isPending} canEdit={canEdit} />
    </form>
  );
}

function SchemaSection({ settings, canEdit }: { settings: SeoSettings; canEdit: boolean }) {
  const { formAction, isPending } = useSeoForm();

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      <input type="hidden" name="section" value="schema" />

      <div className="space-y-3 border border-stone-300 bg-white p-4">
        <CheckboxField label="Organization / LocalBusiness" name="schemaOrganization" defaultChecked={settings.schemaOrganization} disabled={!canEdit} />
        <CheckboxField label="WebSite (and sitelinks search box)" name="schemaWebsite" defaultChecked={settings.schemaWebsite} disabled={!canEdit} />
        <CheckboxField label="BreadcrumbList" name="schemaBreadcrumbs" defaultChecked={settings.schemaBreadcrumbs} disabled={!canEdit} />
        <CheckboxField label="Product / Offer / Brand" name="schemaProduct" defaultChecked={settings.schemaProduct} disabled={!canEdit} />
        <CheckboxField label="FAQPage (on /faq)" name="schemaFaq" defaultChecked={settings.schemaFaq} disabled={!canEdit} />
      </div>

      <div className="border border-stone-300 bg-stone-50 px-4 py-3 text-xs text-ink-soft">
        <p className="font-semibold text-ink">Why there&rsquo;s no rating or review schema</p>
        <p className="mt-1">
          This app has no reviews or ratings feature, so there is no genuine data to mark up. Google&rsquo;s
          structured-data policy requires rating markup to reflect real user-submitted ratings, and
          inventing numbers risks a manual action against the whole domain. If a reviews feature is
          built later, <code className="font-mono-tab">AggregateRating</code> and{" "}
          <code className="font-mono-tab">Review</code> can be added to{" "}
          <code className="font-mono-tab">buildProductSchema</code> then.
        </p>
      </div>

      <SaveButton isPending={isPending} canEdit={canEdit} />
    </form>
  );
}
