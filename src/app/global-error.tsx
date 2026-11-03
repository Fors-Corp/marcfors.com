"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/errors";

/**
 * Last-resort boundary: catches errors thrown by the root layout itself, where
 * `app/error.tsx` cannot help. It must render its own `<html>` / `<body>` because
 * it replaces the root layout, and it cannot rely on `globals.css` being applied,
 * so the styling here is inline and self-contained.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("global-error", { message: error.message, digest: error.digest });
    reportClientError(error, "global-error");
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
          gap: "1rem",
          background: "#070b14",
          color: "#efe6d2",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <p style={{ letterSpacing: "0.3em", textTransform: "uppercase", color: "#d4b07a", fontSize: "0.8rem" }}>
          Marc Fors
        </p>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 500, margin: 0 }}>Something went dark.</h1>
        <p style={{ color: "#c9bba0", maxWidth: "36ch", margin: 0 }}>
          The atlas hit an unexpected error. Reloading usually clears it.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            padding: "0.6rem 1.4rem",
            border: "1px solid #d4b07a",
            borderRadius: "999px",
            background: "transparent",
            color: "#efe6d2",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
