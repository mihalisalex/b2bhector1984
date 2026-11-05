"use client";

import { useActionState } from "react";
import { saveProductEssentialsAction } from "@/lib/productActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import { TextField, TextAreaField, SelectField, SaveBar } from "@/components/admin/products/editor/FormField";
import { RichTextEditor } from "@/components/admin/products/editor/RichTextEditor";
import { BOX_TYPES } from "@/lib/data/boxTypes";
import type { FormState } from "@/lib/actions";
import type { ProductStatus, Style } from "@/lib/types";

const initialState: FormState = {};

const CATEGORIES: { value: Style["category"]; label: string }[] = [
  { value: "boots", label: "Μπότες" },
  { value: "formal", label: "Επίσημα" },
  { value: "wedding", label: "Γαμπριάτικα" },
  { value: "loafers", label: "Loafers" },
  { value: "sneakers", label: "Sneakers" },
  { value: "anatomic", label: "Ανατομικά" },
  { value: "sandals", label: "Σανδάλια" },
];

const SEASONS: { value: Style["season"]; label: string }[] = [
  { value: "summer", label: "Καλοκαιρινό" },
  { value: "winter", label: "Χειμερινό" },
  { value: "both", label: "Και οι δύο σεζόν" },
];

const STATUSES: { value: ProductStatus; label: string; note: string }[] = [
  { value: "active", label: "Ενεργό", note: "Φαίνεται στον κατάλογο και παραγγέλνεται." },
  { value: "draft", label: "Πρόχειρο", note: "Δεν το βλέπουν οι πελάτες." },
  { value: "archived", label: "Αρχειοθετημένο", note: "Αποσύρθηκε. Μένει μόνο στο ιστορικό παραγγελιών." },
];

function toInput(iso?: string): string {
  return iso ? new Date(iso).toISOString().slice(0, 16) : "";
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-stone-300 pt-8">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      {note && <p className="mt-1 max-w-2xl text-sm text-ink-soft">{note}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

/**
 * Everything a product needs, on one page with one Save button. The rarely used fields stay in
 * "Για προχωρημένους" below; this form leaves those values exactly as they are (see
 * saveProductEssentialsAction). Photos save themselves, so they sit above this form.
 */
export function ProductEssentials({
  style,
  canEdit,
  canPrice,
  onSaved,
}: {
  style: Style;
  canEdit: boolean;
  canPrice: boolean;
  onSaved: () => void;
}) {
  const showResult = useToastResult();
  // The toast fires from here, not an effect: the parent remounts this form when the saved
  // product comes back, which would discard an effect waiting on the result.
  const [, formAction, isPending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await saveProductEssentialsAction(style.id, prev, formData);
    showResult(result);
    if (result.success) onSaved();
    return result;
  }, initialState);

  const colour = style.colorways[0];

  return (
    <form action={formAction} className="max-w-5xl space-y-10">
      <Section title="Βασικά">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Όνομα προϊόντος" name="name" defaultValue={style.name} required disabled={!canEdit} />
          <TextField label="Κωδικός" name="styleNumber" defaultValue={style.styleNumber} required disabled={!canEdit} />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <SelectField label="Κατηγορία" name="category" defaultValue={style.category} disabled={!canEdit} options={CATEGORIES} />
          <SelectField label="Σεζόν" name="season" defaultValue={style.season} disabled={!canEdit} options={SEASONS} />
          <TextField label="Χρώμα (στα αγγλικά, π.χ. Brown)" name="colourName" defaultValue={colour?.name ?? ""} required disabled={!canEdit} />
          <div>
            <label htmlFor="colourSwatch" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Δείγμα</label>
            <input id="colourSwatch" type="color" name="colourSwatch" defaultValue={colour?.swatch[0] ?? "#121212"} disabled={!canEdit} className="h-[38px] w-16 border border-stone-300 bg-white p-1" />
          </div>
        </div>
      </Section>

      <Section title="Κείμενα" note="Οι Έλληνες πελάτες βλέπουν την ελληνική στήλη, όλοι οι υπόλοιποι την αγγλική.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="text-sm font-semibold text-ink">Ελληνικά</p>
            <TextField label="Σύντομη περιγραφή" name="taglineEl" defaultValue={style.taglineEl ?? ""} disabled={!canEdit} />
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Περιγραφή</label>
              <RichTextEditor name="descriptionEl" label="Περιγραφή στα ελληνικά" defaultValue={style.descriptionEl ?? ""} disabled={!canEdit} />
            </div>
            <TextAreaField label="Υλικά (με κόμμα)" name="materialsEl" defaultValue={(style.materialsEl ?? []).join(", ")} rows={2} disabled={!canEdit} />
            <TextAreaField label="Χαρακτηριστικά (ένα σε κάθε γραμμή)" name="featuresEl" defaultValue={(style.featuresEl ?? []).join("\n")} rows={4} disabled={!canEdit} />
            <TextAreaField label="Σχόλιο εκπροσώπου" name="lastNoteEl" defaultValue={style.lastNoteEl ?? ""} rows={2} disabled={!canEdit} />
          </div>
          <div className="space-y-5">
            <p className="text-sm font-semibold text-ink">Αγγλικά</p>
            <TextField label="Σύντομη περιγραφή" name="tagline" defaultValue={style.tagline} disabled={!canEdit} />
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Περιγραφή</label>
              <RichTextEditor name="description" label="Περιγραφή στα αγγλικά" defaultValue={style.description} disabled={!canEdit} />
            </div>
            <TextAreaField label="Υλικά (με κόμμα)" name="materials" defaultValue={style.materials.join(", ")} rows={2} disabled={!canEdit} />
            <TextAreaField label="Χαρακτηριστικά (ένα σε κάθε γραμμή)" name="features" defaultValue={style.features.join("\n")} rows={4} disabled={!canEdit} />
            <TextAreaField label="Σχόλιο εκπροσώπου" name="lastNote" defaultValue={style.lastNote} rows={2} disabled={!canEdit} />
          </div>
        </div>
      </Section>

      <Section title="Τιμές" note="Χωρίς ΦΠΑ. Η χονδρική είναι η τιμή καταλόγου: η έκπτωση προπληρωμής αφαιρείται αυτόματα.">
        {!canPrice && <p className="text-sm text-ink-soft">Ο ρόλος σου δεν αλλάζει τιμές.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Χονδρική (€ το ζευγάρι)" name="basePrice" type="number" step="0.01" defaultValue={style.basePrice} required disabled={!canPrice} />
          <TextField label="Προτεινόμενη λιανική (€)" name="msrp" type="number" step="0.01" defaultValue={style.msrp} disabled={!canPrice} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Τιμή έκπτωσης (€, κενό αν δεν έχει)" name="salePrice" type="number" step="0.01" defaultValue={style.salePrice} disabled={!canPrice} />
          <TextField label="Η έκπτωση λήγει (ώρα UTC)" name="saleEndAt" type="datetime-local" defaultValue={toInput(style.saleEndAt)} disabled={!canPrice} />
        </div>
      </Section>

      <Section title="Κιβώτια">
        <div className="flex flex-wrap gap-6">
          {BOX_TYPES.map((box) => (
            <label key={box.id} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input type="checkbox" name={box.id} defaultChecked={style.availableBoxTypes.includes(box.id)} disabled={!canEdit} className="h-4 w-4 accent-ink" />
              {box.totalPairs} ζευγάρια
            </label>
          ))}
        </div>
      </Section>

      <Section title="Εμφάνιση">
        <div className="grid gap-2 sm:grid-cols-3">
          {STATUSES.map((s) => (
            <label key={s.value} className="flex cursor-pointer items-start gap-3 border border-stone-300 bg-white p-3 has-[:checked]:border-ink">
              <input type="radio" name="status" value={s.value} defaultChecked={style.status === s.value || (style.status === "private" && s.value === "draft")} disabled={!canEdit} className="mt-1 h-4 w-4 accent-ink" />
              <span>
                <span className="block text-sm font-semibold text-ink">{s.label}</span>
                <span className="block text-xs text-ink-soft">{s.note}</span>
              </span>
            </label>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="newArrival" defaultChecked={style.newArrival} disabled={!canEdit} className="h-4 w-4 accent-ink" />
          Νέο μοντέλο: να φαίνεται στην αρχική σελίδα
        </label>
      </Section>

      {(canEdit || canPrice) && <SaveBar isPending={isPending} label="Αποθήκευση" />}
    </form>
  );
}
