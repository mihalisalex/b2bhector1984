import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Shared form primitives — extracted from what used to be five near-identical hand-rolled
 * copies of the same label/input/error markup, one per auth form (LoginForm, ApplyForm,
 * ForgotPasswordForm, ResetPasswordForm, ActivateAccountForm). Pure de-duplication: every
 * prop these three components accept is exactly what each call site already passed, so the
 * rendered HTML — and therefore every `name` attribute a server action reads via
 * `formData.get(...)` — is unchanged. The one genuinely new thing is `transition-colors` on
 * focus, added once here so it benefits every consumer instead of nowhere.
 */

const fieldClasses =
  "border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-200 focus-visible:border-signal";

export function TextField({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  mono,
  maxLength,
  minLength,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  /** Style the value in the tabular-numeral mono face — used for spec-sheet-like input
   * (tax ID, style numbers), not prose. */
  mono?: boolean;
  maxLength?: number;
  minLength?: number;
  /** Small helper line under the input (e.g. "At least 8 characters."). */
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        className={cn(fieldClasses, mono && "font-mono-tab")}
      />
      {hint && <span className="text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  required,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <select name={name} required={required} defaultValue="" className={fieldClasses}>
        <option value="" disabled>
          Select one
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

/** `role="alert"` for an error (assertive — interrupts screen readers immediately, matching
 * every prior inline copy of this), `role="status"` for a success confirmation (polite). */
export function FormMessage({ variant, children }: { variant: "error" | "success"; children: ReactNode }) {
  const isError = variant === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      className={cn(
        "border px-3 py-2 text-sm",
        isError ? "border-ember/40 bg-ember-100 text-ember" : "border-positive/40 bg-positive-100 text-positive",
      )}
    >
      {children}
    </p>
  );
}
