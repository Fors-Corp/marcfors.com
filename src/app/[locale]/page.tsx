import { notFound } from "next/navigation";
import { Desk } from "@/components/Desk";
import { JsonLd } from "@/components/JsonLd";
import { getAuditSnapshot } from "@/lib/audit";
import { isLocale } from "@/lib/locale";
import { portfolioJsonLd, profilePageJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <>
      <JsonLd data={profilePageJsonLd(locale)} />
      <JsonLd data={portfolioJsonLd(locale)} />
      <Desk audit={getAuditSnapshot()} initialLocale={locale} />
    </>
  );
}
