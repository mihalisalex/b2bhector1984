import type { JsonLd as JsonLdObject } from "@/lib/seoJsonLd";

/**
 * Renders JSON-LD into the document.
 *
 * The escaping is not optional. Product names, descriptions and admin-authored
 * SEO fields all end up in here, and a value containing the literal text
 * `</script>` would otherwise close this tag early and let the remainder of the
 * string parse as HTML — a stored-XSS vector that `dangerouslySetInnerHTML`
 * does nothing to prevent, because the payload is valid JSON either way.
 * Escaping `<` as `<` keeps the JSON semantically identical (JSON parsers
 * resolve the escape) while making it impossible to terminate the element.
 *
 * `&` and `>` are escaped for the same defence-in-depth reason.
 */
function serialize(schema: JsonLdObject): string {
  return JSON.stringify(schema)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function JsonLd({ schema }: { schema: JsonLdObject | JsonLdObject[] | null }) {
  if (!schema) return null;
  const schemas = Array.isArray(schema) ? schema : [schema];
  if (schemas.length === 0) return null;

  return (
    <>
      {schemas.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serialize(item) }}
        />
      ))}
    </>
  );
}
