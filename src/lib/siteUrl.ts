// The bare apex domain (hectorfootwear.gr, no "www") has no DNS A/AAAA record at the
// registrar — only "www.hectorfootwear.gr" actually resolves, and Vercel is currently
// configured to redirect www -> the bare apex, so even that redirects into a dead end.
// A cold click on a link built from the apex (an activation/password-reset email, opened
// in a browser with no prior connection to the site) fails at DNS resolution before the
// request ever reaches Vercel — confirmed live 2026-08-04. Using "www" here is what
// actually works today; switch back to the bare domain once it has its own DNS record
// and/or Vercel's domain redirect points apex -> www instead of the reverse.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hectorfootwear.gr";
