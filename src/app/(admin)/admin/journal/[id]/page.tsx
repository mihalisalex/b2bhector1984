import { notFound } from "next/navigation";
import { getJournalPostById } from "@/lib/data/journalPosts";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { JournalEditorShell } from "@/components/admin/journal/JournalEditorShell";

export const metadata = { title: "Edit Article", robots: { index: false, follow: false } };

export default async function AdminJournalPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, settings] = await Promise.all([getJournalPostById(id), getSeoSettings()]);
  if (!post) notFound();

  return <JournalEditorShell post={post} siteName={settings.siteName} />;
}
