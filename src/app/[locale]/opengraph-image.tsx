import { isLocale, LOCALES } from "@/lib/locale";
import { openGraphImage, OG_SIZE, OG_TYPE } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = `${SITE_NAME} — AI software engineer`;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleOpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return openGraphImage(isLocale(locale) ? locale : "en");
}
