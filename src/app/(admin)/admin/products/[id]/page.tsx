import { notFound } from "next/navigation";
import { getStyleDetailForAdmin } from "@/lib/data/productAdmin";
import { getAllStyles } from "@/lib/data/styles";
import { getAllBrands } from "@/lib/data/brands";
import { getAllSuppliers } from "@/lib/data/suppliers";
import { getAllCollections } from "@/lib/data/collections";
import { getAllWarehouses } from "@/lib/data/warehouses";
import { getWarehouseBreakdownForStyle } from "@/lib/data/inventory";
import { listMovementsForStyle } from "@/lib/data/inventoryMovements";
import { listImagesForStyle } from "@/lib/data/styleImages";
import { getStyleAnalytics } from "@/lib/data/styleAnalytics";
import { getCurrentAccount } from "@/lib/session";
import { hasPermission } from "@/lib/data/permissions";
import { PRODUCT_PERMISSION_KEYS } from "@/lib/data/permissions";
import { ProductEditorShell } from "@/components/admin/products/editor/ProductEditorShell";
import type { ProductPermissionKey } from "@/lib/types";

export default async function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const style = await getStyleDetailForAdmin(id);
  if (!style) notFound();

  const [allStyles, brands, suppliers, collections, warehouses, warehouseStock, movements, images, account] = await Promise.all([
    getAllStyles(),
    getAllBrands(),
    getAllSuppliers(),
    getAllCollections(),
    getAllWarehouses(),
    getWarehouseBreakdownForStyle(id),
    listMovementsForStyle(id),
    listImagesForStyle(id),
    getCurrentAccount(),
  ]);

  const onHandNow = warehouseStock.reduce((sum, row) => sum + row.onHand, 0);
  const analytics = await getStyleAnalytics(style, onHandNow);

  const permissionEntries = await Promise.all(
    PRODUCT_PERMISSION_KEYS.map(async (key) => [key, await hasPermission(account?.adminRole, key)] as const),
  );
  const permissions = Object.fromEntries(permissionEntries) as Record<ProductPermissionKey, boolean>;

  return (
    <ProductEditorShell
      style={style}
      allStyles={allStyles}
      brands={brands}
      suppliers={suppliers}
      collections={collections}
      warehouses={warehouses}
      warehouseStock={warehouseStock}
      movements={movements}
      images={images}
      analytics={analytics}
      permissions={permissions}
    />
  );
}
