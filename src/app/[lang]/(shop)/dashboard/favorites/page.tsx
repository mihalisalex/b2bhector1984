import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getFavoriteStyleIds } from "@/lib/data/favorites";
import { getStorefrontStyles } from "@/lib/data/styles";
import { getInventoryForStyles, totalOnHandForStyle } from "@/lib/data/inventory";
import { listImagesForStyles } from "@/lib/data/styleImages";
import { ProductCard } from "@/components/product/ProductCard";
import { LinkButton } from "@/components/ui/Button";

export const metadata = { title: "Favorites", robots: { index: false, follow: false } };

export default async function FavoritesPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const [favoriteIds, allStyles] = await Promise.all([getFavoriteStyleIds(account.id), getStorefrontStyles()]);
  const favorites = allStyles.filter((s) => favoriteIds.has(s.id));
  const [inventory, imagesByStyle] = await Promise.all([
    getInventoryForStyles(favorites.map((s) => s.id)),
    listImagesForStyles(favorites.map((s) => s.id)),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
      <nav className="mb-4 text-xs text-ink-soft">
        <Link href="/dashboard" className="hover:text-ink">Dashboard</Link> / Favorites
      </nav>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Favorites
      </h1>

      {favorites.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center">
          <p className="text-sm text-ink-soft">
            No favorites yet — tap the heart icon on any product to save it here for fast reordering.
          </p>
          <LinkButton href="/catalogue" className="mt-5 inline-flex">Browse Catalogue</LinkButton>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {favorites.map((style) => (
            <ProductCard
              key={style.id}
              style={style}
              totalOnHand={totalOnHandForStyle(style.id, inventory)}
              priceMultiplier={account.priceMultiplier}
              favorited
              images={imagesByStyle[style.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
