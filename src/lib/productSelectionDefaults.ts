import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import type { BoxTypeId, Style } from "@/lib/types";
import type { StyleInventory } from "@/lib/data/inventory";
import type { StyleImage } from "@/lib/data/styleImages";

/** Only the fields `pickDefaultColorway` needs, so callers can pass full `StyleImage`s
 * without this module depending on the server-only image layer at runtime. */
type ImageChoice = Pick<StyleImage, "isPrimary" | "colorwayId">;

/**
 * Which colorway a style opens on — used by the product page (server, seeds
 * `ColorwaySelectionProvider`) and by each catalogue card.
 *
 * The admin's primary photo decides this. Marking a photo primary in the Media tab and
 * tagging it to a colorway is the only way to say "this is the colour this style leads
 * with", and until that was read here the answer was always whichever colorway happened
 * to be created first (colorways come back ordered by `sort_order`, which nothing in the
 * admin can change). A style whose hero shot was added later therefore opened on the
 * wrong colour, and the catalogue card and product page both inherited that.
 *
 * Stock still breaks ties: leading with a sold-out colour when a sellable one exists
 * costs an order, so the chosen colorway wins only while it has stock. If nothing is in
 * stock the choice is honoured anyway — at that point every option is equally unsellable,
 * so showing the intended hero beats showing the oldest variant.
 */
export function pickDefaultColorway(
  style: Style,
  inventory: StyleInventory,
  images: ImageChoice[] = [],
): string {
  const hasStock = (colorwayId: string) =>
    Object.values(inventory[colorwayId] ?? {}).some((n) => (n ?? 0) > 0);

  // Guarded against a stale tag: an image can still reference a colorway that has since
  // been deleted, and returning that id would select nothing on the product page.
  const chosenId = images.find((img) => img.isPrimary)?.colorwayId;
  const chosen = chosenId ? style.colorways.find((c) => c.id === chosenId) : undefined;

  if (chosen && hasStock(chosen.id)) return chosen.id;

  const inStock = style.colorways.find((c) => hasStock(c.id));
  return (inStock ?? chosen ?? style.colorways[0]).id;
}

export function pickDefaultBoxType(style: Style, inventory: StyleInventory, colorwayId: string): BoxTypeId {
  const boxTypes = getAvailableBoxTypes(style);
  const inStock = boxTypes.find((b) => (inventory[colorwayId]?.[b.id] ?? 0) > 0);
  return (inStock ?? boxTypes[0]).id;
}
