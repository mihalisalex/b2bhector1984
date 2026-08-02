import { getCurrentAccount } from "@/lib/session";
import { hasPermission } from "@/lib/data/permissions";
import { listRedirects } from "@/lib/data/seoRedirects";
import { RedirectManager } from "@/components/admin/seo/RedirectManager";

export default async function SeoRedirectsPage() {
  const [redirects, account] = await Promise.all([listRedirects(), getCurrentAccount()]);
  const canEdit = await hasPermission(account?.adminRole, "products.seo");

  return (
    <div className="space-y-6">
      <div className="max-w-3xl text-sm text-ink-soft">
        <p>
          Redirects run ahead of the login gate, so a retired product URL sends visitors and
          crawlers straight to its replacement instead of bouncing them to a sign-in page.
        </p>
        <p className="mt-2">
          Renaming a product&rsquo;s URL slug creates a 301 here automatically — those rows are marked
          &ldquo;Auto (slug change)&rdquo;. Deleting one breaks every old link that relied on it.
        </p>
      </div>

      <RedirectManager redirects={redirects} canEdit={canEdit} />
    </div>
  );
}
