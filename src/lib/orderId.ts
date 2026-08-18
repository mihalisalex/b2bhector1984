import { randomBytes } from "node:crypto";

/**
 * Order-number generation.
 *
 * ## Why this isn't `Date.now()` any more
 *
 * Order ids used to be `ORD-${Date.now().toString().slice(-5)}` — the last five digits
 * of the millisecond clock. Those wrap every 100,000 ms, so any two orders placed an
 * exact multiple of 100 seconds apart collided on `orders.id`, which is a primary key.
 * The failure was quiet and nasty: the insert threw, inventory was correctly rolled
 * back, and the buyer got a generic "something went wrong" for an order that would have
 * succeeded on a retry a moment later. Probability scaled with the number of orders ever
 * placed (roughly N/100,000 per checkout), so it would have started biting exactly when
 * the shop got busy.
 *
 * ## The scheme
 *
 * `ORD-YYMMDD-XXXXXXX` — a UTC date stamp plus seven random characters, e.g.
 * `ORD-260817-7K3QFXM`. The date makes an id human-sortable and instantly tells a rep
 * when an order was placed; the random tail is what makes it unique.
 *
 * The alphabet is 32 characters with `0`, `1`, `I` and `O` removed, so an id read out
 * over the phone or copied off a printed proforma can't be mistyped into a different
 * order. Exactly 32 symbols matters: `256 % 32 === 0`, so `byte % 32` is a uniform
 * choice with no modulo bias.
 *
 * ## Why seven characters and not five
 *
 * Because the ids are random rather than sequential, collisions follow the birthday
 * paradox — they show up far below the size of the keyspace. Five characters (32^5, ~33.5
 * million per day) was measured at 563 duplicates in 200,000 same-day ids, matching the
 * predicted N^2/2K almost exactly. That is still fine at any plausible order volume, and
 * the retry below would have absorbed it — but it makes the retry load-bearing, which is
 * the wrong place for the safety of a primary key to live.
 *
 * Seven characters is 32^7, ~34.4 *billion* ids per day. At two hundred orders a day the
 * expected number of collisions is about 6 in ten million days. The retry is then a true
 * backstop for something that should never happen, rather than a mechanism the scheme
 * quietly depends on. Two extra characters cost nothing.
 *
 * ## Why not a Postgres sequence
 *
 * A sequence would be strictly unique with no retry needed, and is the better answer if
 * a migration is cheap. It isn't here: this project has no Supabase CLI, so every DDL
 * change has to be pasted into the dashboard by hand. This is deployable with a `git
 * push` and no database change, and the retry closes the theoretical gap. If a sequence
 * is added later, only this file needs to change.
 *
 * Existing ids (`ORD-55442` and friends) stay valid — `orders.id` is `text`, nothing in
 * the app parses an id, and the two formats are easy to tell apart.
 */

/** 32 symbols, `0`/`1`/`I`/`O` removed. Length must stay a power of two — see the doc above. */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const SUFFIX_LENGTH = 7;

/** How many ids `placeOrder` will try before giving up and surfacing an error. */
export const ORDER_ID_MAX_ATTEMPTS = 5;

export function generateOrderId(now: Date = new Date()): string {
  // "2026-08-17T…" -> "260817". UTC on purpose: the stamp must not shift with the
  // server's timezone, or two ids generated seconds apart could disagree on the date.
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");

  const bytes = randomBytes(SUFFIX_LENGTH);
  let suffix = "";
  for (let i = 0; i < SUFFIX_LENGTH; i += 1) suffix += ALPHABET[bytes[i] % ALPHABET.length];

  return `ORD-${datePart}-${suffix}`;
}
