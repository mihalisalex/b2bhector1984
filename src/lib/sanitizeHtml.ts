import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Allowlist matches exactly what `RichTextEditor`'s toolbar can produce
 * (bold/italic/underline/h2/paragraphs/lists/links) — nothing else should
 * ever legitimately reach this field, whether typed through the editor or
 * posted directly to the server action.
 */
export function sanitizeProductDescription(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "u", "h2", "ul", "ol", "li", "a"],
    allowedAttributes: { a: ["href"] },
    allowedSchemes: ["http", "https", "mailto"],
  });
}
