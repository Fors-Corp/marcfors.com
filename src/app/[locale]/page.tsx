import { notFound } from "next/navigation";
import { Desk } from "@/components/Desk";
import { JsonLd } from "@/components/JsonLd";
import { getAuditSnapshot } from "@/lib/audit";
import { fetchPublicRepos } from "@/lib/github";
import { isLocale } from "@/lib/locale";
import { profilePageJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const repos = await fetchPublicRepos();
  return (
    <>
      <JsonLd data={profilePageJsonLd(locale)} />
      <Desk repos={repos} audit={getAuditSnapshot()} initialLocale={locale} />
    </>
  );
}
