import { redirect } from "next/navigation";

/** Superseded by the enterprise Products module — kept as a redirect so old bookmarks/links still land somewhere real. */
export default function AdminStylesRedirect() {
  redirect("/admin/products");
}
