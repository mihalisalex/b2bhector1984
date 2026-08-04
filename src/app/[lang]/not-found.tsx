import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-stone-50 px-6 text-center">
      <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">Error 404</span>
      <h1 className="font-display mt-3 text-3xl font-bold uppercase tracking-tight text-ink">
        That page isn&rsquo;t in the catalog.
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        The style, order, or page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <div className="mt-6 flex gap-3">
        <LinkButton href="/">Return Home</LinkButton>
        <Link href="/catalogue" className="flex items-center text-sm font-medium text-signal hover:underline">
          Go to Catalogue
        </Link>
      </div>
    </div>
  );
}
