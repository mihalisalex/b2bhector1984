import "server-only";

/**
 * Guards the signed-upload-URL mint step against obviously-wrong file types
 * (e.g. a renamed .html/.svg reaching Storage). Not a full content-sniffing
 * check — the actual bytes are never seen server-side in this app's direct-
 * to-Storage upload pattern (see styleImages.ts) — but it stops the trivial
 * case of an unexpected extension slipping past the client-side `accept`
 * attribute.
 */
export function assertAllowedExtension(fileName: string, allowedExtensions: readonly string[]): void {
  const ext = fileName.toLowerCase().split(".").pop();
  if (!ext || !allowedExtensions.includes(ext)) {
    throw new Error(`File type not allowed: .${ext ?? "unknown"}. Allowed: ${allowedExtensions.join(", ")}`);
  }
}

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"] as const;
export const DOCUMENT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "mp4",
  "mov",
  "webm",
  "jpg",
  "jpeg",
  "png",
] as const;
