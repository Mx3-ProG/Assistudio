import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { InfoPage } from "@/components/marketing/info-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/affiliate-terms">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return pageMetadata(locale, "/affiliate-terms", `${t.pages.affiliateTerms.title} — STUDIO`, t.pages.affiliateTerms.title);
}

export default async function Page({ params }: PageProps<"/[locale]/affiliate-terms">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return <InfoPage title={t.pages.affiliateTerms.title} placeholder={t.pages.placeholderBody} placeholderLabel={t.common.legalPlaceholder} />;
}
