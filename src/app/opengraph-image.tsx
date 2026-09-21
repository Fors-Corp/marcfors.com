import { DEFAULT_LOCALE } from "@/lib/locale";
import { openGraphImage, OG_SIZE, OG_TYPE } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = `${SITE_NAME} — AI software engineer`;

export default function OpenGraphImage() {
  return openGraphImage(DEFAULT_LOCALE);
}
