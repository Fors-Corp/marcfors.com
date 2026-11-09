import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

/**
 * Single 404 for the whole site. It renders its own `<html>` / `<body>` because
 * the root layout is a bare pass-through.
 *
 * It is intentionally static and English-only: reading a per-request value here
 * opts the entire route tree back into on-demand rendering, which would undo the
 * static generation of every localized page. Nested `not-found` boundaries inside
 * `[locale]` are not reliably reached by `notFound()` from descendant pages, so
 * this is the one 404 surface.
 */
export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex" />
        <title>{`Page not found — ${SITE_NAME}`}</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "#070b14",
          color: "#efe6d2",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <p style={{ letterSpacing: "0.3em", textTransform: "uppercase", color: "#d4b07a", fontSize: "0.8rem" }}>
          {SITE_NAME}
        </p>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 500, margin: 0 }}>Page not found</h1>
        <p style={{ color: "#c9bba0", maxWidth: "44ch", margin: 0 }}>
          That address is not part of this atlas.
        </p>
        <Link
          href="/"
          style={{
            marginTop: "0.5rem",
            padding: "0.6rem 1.4rem",
            border: "1px solid #d4b07a",
            borderRadius: "999px",
            color: "#efe6d2",
            textDecoration: "none",
          }}
        >
          Go to homepage
        </Link>
      </body>
    </html>
  );
}
