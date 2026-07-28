import { redirect } from "next/navigation";

/** Superseded by the enterprise Products module — kept as a redirect so old bookmarks/links still land somewhere real. */
export default async function AdminStyleDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/products/${id}`);
}
