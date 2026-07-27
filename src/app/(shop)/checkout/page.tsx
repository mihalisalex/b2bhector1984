import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8 lg:px-10">
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Checkout
      </h1>
      <CheckoutForm account={account} />
    </div>
  );
}
