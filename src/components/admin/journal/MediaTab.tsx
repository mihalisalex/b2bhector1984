import Image from "next/image";
import { createJournalImageUploadUrlAction, finalizeJournalImageUploadAction } from "@/lib/journalActions";
import { ImageUploadForm } from "@/components/admin/ImageUploadForm";
import type { JournalPost } from "@/lib/types";

export function MediaTab({ post }: { post: JournalPost }) {
  return (
    <div className="max-w-xl pb-20">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Featured image</span>
      <p className="mt-1 text-xs text-ink-soft">Used on the journal listing, the article header, and as the fallback Open Graph image.</p>

      <div className="relative mt-3 aspect-[16/9] w-full overflow-hidden border border-stone-300 bg-stone-100">
        {post.featuredImageUrl ? (
          <Image
            src={post.featuredImageUrl}
            alt={`${post.title} featured image`}
            fill
            sizes="(min-width: 1024px) 576px, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-soft">No image uploaded yet</div>
        )}
      </div>

      <ImageUploadForm
        createUploadTarget={createJournalImageUploadUrlAction.bind(null, post.id)}
        finalizeUpload={finalizeJournalImageUploadAction.bind(null, post.id)}
        buttonLabel={post.featuredImageUrl ? "Upload & replace" : "Upload image"}
      />
    </div>
  );
}
