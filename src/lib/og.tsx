import { ImageResponse } from "next/og";
import { copy } from "@/data/copy";
import type { Locale } from "@/lib/locale";
import { SITE_NAME } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";

export function openGraphImage(locale: Locale) {
  const t = copy[locale];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(180deg, #0a1020 0%, #070b14 55%)",
          color: "#efe6d2",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            color: "#d4b07a",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "2px solid #d4b07a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 12, background: "#7dcf9a" }} />
          </div>
          <div style={{ display: "flex" }}>{SITE_NAME}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 80, lineHeight: 1, letterSpacing: -2 }}>{SITE_NAME}</div>
          <div style={{ display: "flex", fontSize: 34, color: "#c9bba0" }}>{t.headline}</div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              color: "#7dcf9a",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {`${t.kicker} · ${t.seeking}`}
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
