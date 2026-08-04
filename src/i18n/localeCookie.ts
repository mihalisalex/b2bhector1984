export const LOCALE_COOKIE = "hector_locale";

/** Client-side only — call from a "use client" component after the user picks a language. */
export function setLocaleCookie(locale: string) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}
