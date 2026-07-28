"use client";

export function TextField({
  label,
  name,
  defaultValue,
  type = "text",
  step,
  required,
  disabled,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  step?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100 disabled:text-ink-soft"
      />
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  defaultValue,
  rows = 3,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        disabled={disabled}
        defaultValue={defaultValue}
        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100 disabled:text-ink-soft"
      />
    </div>
  );
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100 disabled:text-ink-soft"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
  disabled,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} disabled={disabled} className="h-4 w-4 accent-ink" />
      {label}
    </label>
  );
}

export function SaveBar({ isPending, label = "Save" }: { isPending: boolean; label?: string }) {
  return (
    <div className="sticky bottom-0 -mx-6 border-t border-stone-300 bg-white/95 px-6 py-3 backdrop-blur lg:-mx-10 lg:px-10">
      <button
        type="submit"
        disabled={isPending}
        className="border border-ink bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
      >
        {isPending ? "Saving…" : label}
      </button>
    </div>
  );
}
