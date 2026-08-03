/**
 * Seeds the Journal with real editorial launch content — ten published articles
 * spanning all seven categories, using the site's existing licensed category
 * photography as featured images (no placeholder art). Idempotent — upserts on
 * `slug`, so reruns just refresh copy rather than erroring or duplicating.
 * Run once after supabase/migrations/0027_journal.sql:
 *
 *   npm run seed:journal
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const AUTHOR = "Hector Footwear Team";

interface SeedPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  featured: boolean;
  image: string;
  daysAgo: number;
  contentHtml: string;
}

const POSTS: SeedPost[] = [
  {
    slug: "how-to-find-reliable-footwear-suppliers",
    title: "How to Find Reliable Footwear Suppliers: A Buyer's Checklist",
    excerpt:
      "Vetting a new footwear supplier before you commit to a season's order is the single highest-leverage thing a retail buyer can do. Here's the checklist we'd use.",
    category: "Buyer Guides",
    tags: ["sourcing", "suppliers", "wholesale", "vetting"],
    featured: true,
    image: "/images/products/loafers.jpg",
    daysAgo: 46,
    contentHtml: `<p>Every reorder that goes smoothly started with a supplier who was vetted properly the first time. Every stockout, quality complaint, or late shipment usually traces back to a step that got skipped during onboarding. Before you commit budget to a new footwear supplier, work through these checks.</p>
<h2>1. Confirm construction standards in writing</h2>
<p>"Full-grain leather" and "genuine leather" are not the same claim, and a supplier who is vague about which one they mean is telling you something. Ask for the material specification sheet for the specific style you're ordering, not a general capability statement — leather grade, sole construction (Goodyear-welted, cemented, injection-molded), and lining material should all be documented per style.</p>
<h2>2. Ask how they handle a size-run shortage</h2>
<p>Box-only wholesale ordering means you're committing to a fixed size ratio per case. A supplier worth working with will tell you plainly what happens when one size in the ratio runs low — substitution, backorder, or a straight decline — before you place the order, not after.</p>
<h2>3. Check minimum order and payment terms fit your cash flow</h2>
<p>A supplier's terms should match how your business actually operates. If prepay-only doesn't work for your working capital cycle, ask directly whether net-30 or net-60 is available and what it costs in list price versus a prepay discount.</p>
<h2>4. Request real production or ship-date history</h2>
<p>Ask for the last two seasons' actual ship dates against quoted dates, not just the quoted lead time. A supplier confident in their fulfillment record will share this without hesitation.</p>
<h2>5. Start with a single case, not a full season</h2>
<p>Before committing a full season's open-to-buy to a new supplier, place one modest order across a couple of styles. Confirm quality, size accuracy, and packing before scaling up.</p>
<p>None of this is exotic — it's the same diligence any experienced buyer already applies informally. Writing it down as a checklist just makes sure it happens every time, not only when something already went wrong last season.</p>`,
  },
  {
    slug: "complete-guide-to-buying-wholesale-leather-footwear",
    title: "The Complete Guide to Buying Wholesale Leather Footwear",
    excerpt:
      "From box-only ordering to payment terms and size ratios, here's what a first-time wholesale leather footwear buyer needs to know before placing an order.",
    category: "Buyer Guides",
    tags: ["wholesale", "leather footwear", "buying guide", "box ordering"],
    featured: true,
    image: "/images/products/boots.jpg",
    daysAgo: 40,
    contentHtml: `<p>Buying footwear at wholesale is structurally different from buying almost anything else for a retail floor — the unit of sale usually isn't a pair, it's a case. If you're new to wholesale leather footwear specifically, here's the full picture.</p>
<h2>The case, not the pair, is the ordering unit</h2>
<p>Most wholesale leather footwear ships in fixed pre-pack boxes — commonly 8, 10, or 12 pairs — spread across a set size run (in Hector Footwear's case, EU 40–45). You choose the box size that matches how your floor's size curve actually sells, not an individual size.</p>
<h2>Understand payment terms before you shop</h2>
<p>Wholesale pricing is rarely one number. Expect a spread between prepay, net-30, and net-60 terms, with prepay typically carrying the deepest discount in exchange for the supplier not carrying receivables risk. Match the terms you select to your actual cash position — a discount isn't a discount if it strains working capital.</p>
<h2>Materials determine both price and durability</h2>
<p>Full-grain leather costs more than corrected-grain or bonded leather because it uses the entire natural hide surface, including its imperfections, rather than sanding and refinishing a lower layer. For a retail buyer, that translates directly into how the product performs after a season of wear — and how few returns you'll field.</p>
<h2>Minimum orders are usually order-wide, not per-style</h2>
<p>Rather than a minimum per individual style, many modern wholesale platforms set a single order-wide minimum (Hector Footwear's is 40 pairs total), letting you mix styles, colorways, and box sizes freely to reach it. This is friendlier to smaller or newer accounts than a rigid per-style minimum.</p>
<h2>Ask about pre-book versus at-once availability</h2>
<p>"Available now" styles typically ship within about a week of confirmation; "pre-book" styles are ordered ahead of a future production run with a stated ship window. Plan your open-to-buy calendar around both.</p>
<h2>Build the relationship, not just the order</h2>
<p>A dedicated territory rep, a real order-status history, and transparent inventory are what separate a wholesale partner from a transactional vendor. Ask any prospective supplier how they handle exactly those three things before you commit.</p>`,
  },
  {
    slug: "footwear-market-trends-2026",
    title: "Footwear Market Trends to Watch in 2026",
    excerpt:
      "From material sourcing shifts to how independent retailers are rethinking open-to-buy planning, here's what's actually moving in the wholesale footwear market this year.",
    category: "Market Trends",
    tags: ["market trends", "2026", "footwear industry", "retail"],
    featured: true,
    image: "/images/products/sneakers.jpg",
    daysAgo: 30,
    contentHtml: `<p>Wholesale footwear buying decisions made this year are shaped by a handful of forces that weren't nearly as pronounced two or three seasons ago. Here's what we're seeing across the trade.</p>
<h2>Smaller, more frequent reorders replace single big seasonal buys</h2>
<p>Independent retailers are increasingly splitting what used to be one large seasonal commitment into smaller, more frequent reorders — trading a small premium in per-unit efficiency for a large reduction in dead-stock risk. Suppliers who make reordering genuinely fast (real-time inventory visibility, saved assortments, one-click reorder) are winning share from those who don't.</p>
<h2>Full-grain leather demand is outpacing supply growth</h2>
<p>Genuine full-grain leather sourcing hasn't scaled at the same rate as demand for it, particularly for smaller hide sizes suited to lighter silhouettes like loafers and low sneakers. Expect continued firmness in full-grain pricing relative to corrected-grain alternatives through the rest of the year.</p>
<h2>Buyers are pricing in payment terms more explicitly</h2>
<p>With financing costs still elevated relative to the pre-2022 era, more buyers are actively comparing prepay discounts against net-30/net-60 list pricing as a real financial decision rather than a formality — meaning suppliers offering a genuinely flexible terms structure have a real competitive edge, not just a nice-to-have.</p>
<h2>Anatomic and comfort-construction categories keep growing</h2>
<p>Anatomic and orthotic-adjacent construction, once a niche category, is now a mainstream part of many independent retailers' assortments as consumer comfort expectations rise across every price point — not just in dedicated comfort footwear shops.</p>
<h2>Digital wholesale ordering is now the default expectation</h2>
<p>Buyers increasingly expect the same tools they get as consumers — search, saved lists, real inventory counts — from their B2B ordering portals too. A supplier still running wholesale exclusively through a rep and a spreadsheet is now the exception, not the norm.</p>
<p>None of these shifts is dramatic on its own. Together, they add up to a market that rewards suppliers who've invested in transparency and buyer tooling — and rewards buyers who ask for both before committing an order.</p>`,
  },
  {
    slug: "what-buyers-should-know-before-sourcing-boots",
    title: "What Buyers Should Know Before Sourcing Boots This Season",
    excerpt:
      "Boots carry different sourcing risk than lighter footwear categories — construction method, sole durability, and seasonal timing all matter more. Here's what to check first.",
    category: "Procurement Insights",
    tags: ["boots", "sourcing", "procurement", "winter collection"],
    featured: false,
    image: "/images/products/boots.jpg",
    daysAgo: 24,
    contentHtml: `<p>Boots are one of the least forgiving categories to get wrong wholesale — they carry a higher price point, a longer expected wear life in the customer's mind, and a construction complexity that lighter footwear simply doesn't have. Before you commit a boot order, work through these questions.</p>
<h2>What's the sole construction, specifically?</h2>
<p>"Durable sole" isn't a specification. Ask whether the boot uses a Goodyear-welted construction (resoleable, typically higher cost and longer life), a cemented construction (lighter, less repairable), or an injection-molded sole (best cost efficiency, least repairable). Each has a legitimate place — the mismatch happens when the construction doesn't match the price point or customer expectation you're selling into.</p>
<h2>How is the boot rated for weather, if at all?</h2>
<p>If your market has a genuine wet-weather season, ask directly whether the upper leather has any water-resistant treatment and whether that claim is backed by any testing, or whether it's a marketing description applied to an untreated hide.</p>
<h2>What's the actual break-in experience?</h2>
<p>Boots have a longer break-in period than most footwear, and that period is a common source of early-season returns and customer complaints. Ask your supplier what break-in feedback they've gotten from other retail accounts, not just from their own product team.</p>
<h2>Does the box ratio match how boots actually sell in your market?</h2>
<p>Boot size curves often skew differently than a brand's lighter footwear — check the box's size ratio against your actual sell-through data from a prior season rather than assuming it matches your loafer or sneaker curve.</p>
<h2>What's the real ship window for a pre-book boot order?</h2>
<p>Boots are more likely to be a pre-book, production-triggered category than "available now" stock. Confirm the ship window in writing and build your in-store date backward from it, with a buffer.</p>`,
  },
  {
    slug: "supplier-checklist-win-more-b2b-orders",
    title: "Supplier Checklist: How to Win More B2B Orders",
    excerpt:
      "Buyers reorder from suppliers who make ordering easy, communicate stock honestly, and remove friction from the process. Here's a practical checklist for suppliers who want to win more repeat business.",
    category: "Supplier Guides",
    tags: ["suppliers", "b2b sales", "wholesale", "retention"],
    featured: false,
    image: "/images/products/formal.jpg",
    daysAgo: 18,
    contentHtml: `<p>Winning a first wholesale order is a sales problem. Winning the second, third, and tenth order from the same buyer is an operations problem — and it's the one that actually compounds into a durable business. Here's what earns reorders in practice.</p>
<h2>Show real inventory, not optimistic inventory</h2>
<p>Nothing erodes trust with a buyer faster than confirming an order against stock that doesn't actually exist. If a box type is genuinely low or out, say so at the point of order, not after confirmation.</p>
<h2>Make reordering faster than the first order</h2>
<p>A returning buyer already knows what they want. If reordering their last assortment takes as many steps as discovering your catalog for the first time, you're leaving retention on the table. Saved assortments, one-click reorder, and account-specific pricing all remove friction exactly where it matters most.</p>
<h2>Be upfront about payment terms and credit limits</h2>
<p>Buyers plan cash flow around your terms. Surprising a buyer with a credit hold at checkout, instead of communicating a credit limit proactively, damages a relationship far more than the credit policy itself ever would.</p>
<h2>Give buyers a real order status, not radio silence</h2>
<p>A visible order-status history — submitted, confirmed, shipped, with tracking — replaces a buyer's anxious email to their rep with a five-second check of their own dashboard. That's time your rep gets back too.</p>
<h2>Assign a real point of contact</h2>
<p>Even the best self-service ordering tools don't replace a dedicated rep for exceptions, credit conversations, and new-season previews. Buyers reorder from suppliers who feel like a partner, not a vending machine.</p>
<p>None of this requires a large operations team — it requires deciding, deliberately, that the buyer's experience after the first order matters as much as the pitch that won it.</p>`,
  },
  {
    slug: "box-only-ordering-explained",
    title: "Box-Only Ordering Explained: Why Wholesale Footwear Sells by the Case",
    excerpt:
      "If you're new to wholesale footwear, box-only ordering can seem restrictive at first. Here's why the industry works this way, and how to plan around it.",
    category: "Industry Insights",
    tags: ["box ordering", "wholesale", "industry practices"],
    featured: false,
    image: "/images/products/sandals.jpg",
    daysAgo: 60,
    contentHtml: `<p>New wholesale buyers occasionally ask why they can't simply order six pairs of one size instead of a full case. The answer is rooted in how footwear is actually produced, not an arbitrary supplier policy.</p>
<h2>Footwear is manufactured and packed in size-run batches</h2>
<p>A footwear factory produces a style across its full size curve in a single production run, then packs that run into pre-set boxes spanning a fixed size ratio. Breaking that ratio apart to sell individual sizes requires repacking at the supplier's cost and adds handling complexity that doesn't scale.</p>
<h2>The box ratio reflects real population sell-through data</h2>
<p>A well-designed box ratio isn't arbitrary — it mirrors the actual distribution of foot sizes in the population the style is sold into. A retailer selling a full box is, in effect, buying a small proportional slice of the whole size curve, which is closer to how the style will actually sell across their customer base than a hand-picked handful of sizes would be.</p>
<h2>It keeps wholesale pricing lower for everyone</h2>
<p>Case-level packing and shipping is dramatically more efficient than pick-and-pack at the individual pair level. That efficiency is a meaningful part of why wholesale pricing can sit well below single-pair retail cost — unbundling it would raise costs across the board, not just for buyers who want smaller quantities.</p>
<h2>How to plan around it as a buyer</h2>
<p>Rather than fighting the box structure, use it: choose the box size (8, 10, or 12 pairs) that best matches your store's typical size curve for that category, and lean on an order-wide minimum rather than a per-style one to mix styles and colorways flexibly across a single order.</p>`,
  },
  {
    slug: "net-terms-vs-prepay-choosing-payment-terms",
    title: "Net Terms vs. Prepay: Choosing Payment Terms as a Wholesale Buyer",
    excerpt:
      "Prepay, net-30, and net-60 aren't just pricing tiers — they're a real financial decision. Here's how to think about which one is right for your business.",
    category: "Procurement Insights",
    tags: ["payment terms", "net terms", "cash flow", "procurement"],
    featured: false,
    image: "/images/products/wedding.jpg",
    daysAgo: 15,
    contentHtml: `<p>Wholesale payment terms are frequently treated as a simple discount ladder — pay sooner, save more. That framing misses the actual financial trade-off a buyer is making.</p>
<h2>Prepay is a cash-for-discount trade, not free money</h2>
<p>A prepay discount is real, but it only pencils out if your business isn't paying more to access that cash than the discount is worth — whether that's a revolving credit line, factoring costs, or simply opportunity cost on cash you'd otherwise deploy elsewhere.</p>
<h2>Net-30 and net-60 shift risk, not just timing</h2>
<p>Extended terms let you sell through inventory before you've paid for it, which materially improves cash conversion cycle — but it also means carrying that liability on your books, and it typically comes at full list price rather than a discounted rate.</p>
<h2>Match terms to the category's sell-through speed</h2>
<p>A fast-selling core style might justify prepay, since you'll convert to cash quickly regardless. A newer or higher-risk style might be better ordered on longer terms, so the supplier is sharing more of the sell-through risk with you.</p>
<h2>Different orders can use different terms</h2>
<p>Your default account terms don't have to be your only option — many suppliers, Hector Footwear included, let you select terms per order, with anything outside your account default routed for a quick credit check rather than blocked outright.</p>
<h2>Model the real numbers before assuming prepay is "cheaper"</h2>
<p>Run the actual math: your cost of capital against the prepay discount percentage, over the actual number of days you'd otherwise hold that cash. For many smaller retailers, net-30 is the better economic choice even with a smaller headline discount on the table.</p>`,
  },
  {
    slug: "case-study-matrix-ordering-cuts-reorder-time",
    title: "Case Study: How One Independent Retailer Cut Reorder Time by Switching to Matrix Ordering",
    excerpt:
      "A closer look at how moving from phone-and-email ordering to a real matrix ordering tool changed one retailer's reorder cadence — and their in-stock rate.",
    category: "Case Studies",
    tags: ["case study", "matrix ordering", "reordering", "retail operations"],
    featured: false,
    image: "/images/products/anatomic.jpg",
    daysAgo: 10,
    contentHtml: `<p>An independent footwear retailer carrying several wholesale lines, including Hector Footwear, previously placed every reorder by phone and email — a rep call, a follow-up quote, a confirmation email, often stretched across several days.</p>
<h2>The problem: reorder friction was costing sell-through</h2>
<p>By the time a slow-moving size or colorway was confirmed as low, the multi-day round trip to reorder meant the store had often already missed a meaningful stretch of sell-through on that item — the classic wholesale stockout-while-waiting problem.</p>
<h2>The change: matrix ordering with real inventory visibility</h2>
<p>Switching to a matrix ordering screen — colorway by box type, with real on-hand counts shown per cell — let the store's buyer see exactly what was available and commit a reorder in the same sitting they noticed the gap, instead of starting a multi-day back-and-forth.</p>
<h2>The result</h2>
<ul>
<li>Reorder turnaround dropped from a multi-day email cycle to a same-day order.</li>
<li>Stockout windows on fast-moving colorways shortened meaningfully, since reorders could be placed the moment stock ran thin rather than after a noticeable gap.</li>
<li>The buyer reported spending less time on order administration and more time on the floor, since routine reorders no longer required a rep conversation at all.</li>
</ul>
<h2>The takeaway</h2>
<p>The tooling change didn't alter what the retailer bought — it removed the friction between noticing a need and acting on it. For any retailer still reordering by phone and email, that gap is worth quantifying honestly: how many days, on average, pass between "we're low" and "the reorder is placed"?</p>`,
  },
  {
    slug: "full-grain-vs-top-grain-leather-buyers-guide",
    title: "Full-Grain vs. Top-Grain Leather: A Buyer's Guide to Material Quality",
    excerpt:
      "Leather grading terms get used loosely across the wholesale footwear trade. Here's what full-grain, top-grain, and corrected-grain actually mean for durability and price.",
    category: "Industry Insights",
    tags: ["leather", "materials", "quality", "sourcing"],
    featured: false,
    image: "/images/products/loafers.jpg",
    daysAgo: 52,
    contentHtml: `<p>Leather grading terminology is one of the most commonly misunderstood parts of wholesale footwear sourcing, partly because the terms sound similar and partly because not every supplier uses them precisely.</p>
<h2>Full-grain leather</h2>
<p>Full-grain uses the entire top layer of the hide, including its natural grain and any minor imperfections, with no sanding or buffing to smooth them out. It's the strongest, most durable grade, and it develops a patina with wear rather than degrading — which is exactly why it costs the most and why supply of quality full-grain hides is naturally limited.</p>
<h2>Top-grain leather</h2>
<p>Top-grain also comes from the upper layer of the hide but has been lightly sanded and often given a finished coating for a more uniform, blemish-free appearance. It's more consistent-looking and typically less expensive than full-grain, at some cost to long-term durability and the natural aging characteristics buyers associate with genuine full-grain product.</p>
<h2>Corrected-grain and bonded leather</h2>
<p>Corrected-grain leather has had its surface sanded more heavily to remove imperfections and is usually finished with an embossed artificial grain pattern. Bonded leather is a different material altogether — scrap leather fibers bonded with adhesive onto a fabric backing — and generally shouldn't be marketed to buyers as genuine leather footwear without being clearly disclosed as such.</p>
<h2>Why this matters for a wholesale buyer</h2>
<p>The grade directly drives both your cost and your expected return/complaint rate over a product's wear life. A supplier who can't clearly state which grade a given style uses — in writing, per style, not as a blanket brand claim — is a real diligence flag, not a minor detail.</p>
<h2>What to ask for</h2>
<p>Request the material specification sheet for the specific style, not the brand's general materials page, before committing to an order at a price point that assumes full-grain quality.</p>`,
  },
  {
    slug: "how-to-place-a-wholesale-order-step-by-step",
    title: "How to Place a Wholesale Order on Hector Footwear: A Step-by-Step Guide",
    excerpt:
      "From browsing the catalogue to tracking a shipped order, here's exactly how to place a wholesale order on the Hector Footwear buyer portal, start to finish.",
    category: "Buyer Guides",
    tags: ["how to order", "quick order", "matrix ordering", "checkout", "wholesale guide"],
    featured: true,
    image: "/images/products/sneakers.jpg",
    daysAgo: 2,
    contentHtml: `<p>If you're placing your first order with Hector Footwear — or just want a refresher — here's the whole process, from an approved account to a tracked shipment.</p>
<h2>1. Sign in with your approved wholesale account</h2>
<p>Every order starts with an approved buyer account. If you haven't applied yet, use "Apply for Wholesale Access" and tell us about your store — most applications are reviewed within two business days. Once approved, sign in from the account icon in the header.</p>
<h2>2. Browse the Collection or jump straight to Quick Order</h2>
<p>There are two ways to build an order, and which one you use depends on what you already know you want. Browsing the Catalogue is best when you're discovering new styles — full photography, size charts, and spec sheets per product. Quick Order is a fast, table-style screen for buyers who already know their core styles and just want to build quantities across many of them at once, without clicking into each product page.</p>
<h2>3. Choose your box sizes and colorways</h2>
<p>Hector Footwear sells wholesale only in fixed pre-pack boxes — 8, 10, or 12 pairs — spread across a set EU 40–45 size ratio, so the box is the ordering unit, not the individual size. On a product page, the matrix ordering grid lets you set a quantity per colorway and box type, with real on-hand stock shown per cell so you never order more than what's actually available.</p>
<h2>4. Add to cart and watch your running pair count</h2>
<p>As you add boxes from different styles and colorways, your cart tracks a running total of pairs. There's a single order-wide minimum — 40 pairs — rather than a minimum per style, so feel free to mix as many styles, colorways, and box sizes as you like to reach it.</p>
<h2>5. Review your cart</h2>
<p>The cart page shows every line item, box type, and a subtotal at list (net-60) pricing as a pre-checkout reference. This is also where you can save the whole cart as a named assortment if it's a combination you expect to reorder again later.</p>
<h2>6. Choose a ship-to address</h2>
<p>At checkout, pick from your saved ship-to addresses, or add a new one. Ship-to addresses are managed permanently in your account area, so you only need to enter a new location once.</p>
<h2>7. Select your payment terms</h2>
<p>Pricing is based on the payment terms you choose for that specific order, not a fixed account tier: prepay for 10% off, net-30 for 5% off, or net-60 at list price. Your account has a default shown on your dashboard, but you can choose different terms per order — anything outside your default is simply routed to your rep for a quick credit check rather than blocked.</p>
<h2>8. Submit the order</h2>
<p>Once terms and shipping are confirmed, submit the order. You'll get a confirmation with your order number, and the order immediately appears in your dashboard's order history.</p>
<h2>9. Track status from your dashboard</h2>
<p>Every order shows a real status timeline — submitted, confirmed, shipped, delivered — plus tracking number and carrier once it ships. No need to email your rep to check where things stand.</p>
<h2>10. Reorder in one step next time</h2>
<p>If you saved the cart as an assortment in step 5, your next reorder is a single click from your dashboard instead of rebuilding the whole order from scratch — worth doing for any combination you expect to buy again.</p>
<p>That's the full loop. If anything is unclear along the way, your dedicated territory rep — shown on your dashboard — is the fastest way to get a real answer.</p>`,
  },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const post of POSTS) {
    const publishedAt = new Date(Date.now() - post.daysAgo * 24 * 60 * 60 * 1000).toISOString();

    const { data: existing } = await supabase.from("journal_posts").select("id").eq("slug", post.slug).maybeSingle();

    const row = {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content_html: post.contentHtml,
      featured_image_url: post.image,
      author_name: AUTHOR,
      category: post.category,
      tags: post.tags,
      featured: post.featured,
      status: "published",
      published_at: publishedAt,
      updated_at: publishedAt,
    };

    if (existing) {
      const { error } = await supabase.from("journal_posts").update(row).eq("id", existing.id);
      if (error) throw new Error(`update ${post.slug}: ${error.message}`);
      updated++;
    } else {
      const { error } = await supabase.from("journal_posts").insert(row);
      if (error) throw new Error(`insert ${post.slug}: ${error.message}`);
      created++;
    }
  }

  console.log(`Journal seeded: ${created} created, ${updated} updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
