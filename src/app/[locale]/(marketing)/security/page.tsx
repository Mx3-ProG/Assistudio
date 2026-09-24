import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { InfoPage } from "@/components/marketing/info-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/security">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return pageMetadata(locale, "/security", `${t.pages.security.title} — STUDIO`, t.pages.security.title);
}

export default async function Page({ params }: PageProps<"/[locale]/security">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return <InfoPage title={t.pages.security.title} body={t.pages.security.body} />;
}
