"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown by the root layout itself, which `error.tsx`
 * sits inside and therefore cannot catch. It replaces the whole document, so it must
 * render its own <html>/<body> and cannot rely on the root layout's font variables or
 * Tailwind classes being applied — hence the inline styles, which are guaranteed to
 * render legibly even when the stylesheet never loaded.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#fafafa",
          color: "#121212",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Arial, sans-serif",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6b6b" }}>
          Hector Footwear
        </p>
        <h1 style={{ margin: 0, fontSize: "1.75rem", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
          Something went wrong
        </h1>
        <p style={{ margin: 0, maxWidth: "26rem", fontSize: "0.875rem", lineHeight: 1.6, color: "#6b6b6b" }}>
          The site failed to load. This is usually temporary — please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "0.75rem",
            padding: "0.7rem 1.5rem",
            fontSize: "0.8125rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#ffffff",
            background: "#121212",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        {error.digest && (
          <p style={{ marginTop: "1.5rem", fontSize: "0.6875rem", textTransform: "uppercase", color: "#6b6b6b" }}>
            Reference {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
