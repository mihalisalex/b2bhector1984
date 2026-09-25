"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { whatsappHref } from "@/lib/contact";
import { cn } from "@/lib/cn";

/**
 * Floating "ask us on WhatsApp" button, bottom-left on every storefront page (the back-to-top
 * button owns bottom-right). On a phone's product page it hides: the sticky buy bar sits at
 * the bottom there, and the same link is in the product's trust points instead.
 */
export function WhatsAppButton() {
  const { dict } = useI18n();
  const pathname = usePathname();
  const onProductPage = /\/product\//.test(pathname ?? "");

  return (
    <a
      href={whatsappHref(dict.contact.whatsappMessage)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={dict.contact.whatsappAria}
      title={dict.contact.whatsappAria}
      className={cn(
        "fixed bottom-4 left-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(26,29,34,0.25)] transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink print:hidden",
        onProductPage && "hidden lg:flex",
      )}
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <svg viewBox="0 0 32 32" aria-hidden className="h-6 w-6" fill="currentColor">
        <path d="M16.04 4C9.4 4 4 9.33 4 15.9c0 2.1.56 4.15 1.62 5.95L4 28l6.33-1.64a12.1 12.1 0 0 0 5.7 1.43h.01C22.67 27.79 28 22.46 28 15.9 28 9.33 22.67 4 16.04 4Zm0 21.8h-.01a10 10 0 0 1-5.12-1.4l-.37-.22-3.76.97 1-3.62-.24-.37a9.8 9.8 0 0 1-1.53-5.26c0-5.46 4.49-9.9 10.03-9.9 5.52 0 10 4.44 10 9.9 0 5.46-4.48 9.9-10 9.9Zm5.49-7.4c-.3-.15-1.78-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.27-.46-2.42-1.47-.9-.79-1.5-1.77-1.67-2.07-.18-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.62-.93-2.22-.25-.58-.5-.5-.68-.5h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.17 5.08 4.44.71.3 1.27.49 1.7.62.72.23 1.37.2 1.88.12.57-.08 1.78-.72 2.03-1.42.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.58-.35Z" />
      </svg>
    </a>
  );
}
