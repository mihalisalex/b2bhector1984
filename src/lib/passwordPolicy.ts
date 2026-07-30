/**
 * Password rules shared by every flow that sets a password — the reset form, the
 * change-password form, and the Server Actions behind both. Kept in its own
 * dependency-free module for two reasons:
 *
 *  - `actions.ts` is a `"use server"` file, which may only export async functions, so a
 *    plain constant cannot live there.
 *  - `passwords.ts` imports `node:crypto`, so importing this from a Client Component via
 *    that module would drag server-only crypto into the browser bundle.
 *
 * Both flows previously hardcoded their own minimum and had drifted apart (8 on reset,
 * 6 on change); this is the single source of truth so they can't diverge again.
 */
export const MIN_PASSWORD_LENGTH = 8;
