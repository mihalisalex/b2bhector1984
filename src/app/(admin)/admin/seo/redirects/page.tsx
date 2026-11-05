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
          Οι ανακατευθύνσεις τρέχουν πριν από τη σύνδεση, οπότε μια παλιά διεύθυνση προϊόντος στέλνει επισκέπτες και μηχανές αναζήτησης κατευθείαν στη νέα της.
        </p>
        <p className="mt-2">
          Όταν αλλάζει η διεύθυνση ενός προϊόντος, δημιουργείται εδώ αυτόματα ανακατεύθυνση 301, με την ένδειξη «Αυτόματη». Αν τη διαγράψεις, χαλάνε τα παλιά links που βασίζονταν σε αυτήν.
        </p>
      </div>

      <RedirectManager redirects={redirects} canEdit={canEdit} />
    </div>
  );
}
