import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Footer } from "@/components/layout/Footer";
import { FloatingQuickOrder } from "@/components/layout/FloatingQuickOrder";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingQuickOrder />
    </>
  );
}
