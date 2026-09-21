import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: "AI software engineer in Barcelona.",
    start_url: "/",
    display: "browser",
    background_color: "#10141c",
    theme_color: "#10141c",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
    ],
  };
}
