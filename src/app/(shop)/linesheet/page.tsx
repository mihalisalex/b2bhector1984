import { redirect } from "next/navigation";

/** Linesheet and Quick Order are now one page — keep this URL alive for old links/bookmarks. */
export default function LinesheetPage() {
  redirect("/quick-order");
}
