import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { InfoPage } from "@/components/marketing/info-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return pageMetadata(locale, "/terms", `${t.pages.terms.title} — Studio ATS`, t.pages.terms.title);
}

export default async function Page({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return <InfoPage title={t.pages.terms.title} placeholder={t.pages.placeholderBody} placeholderLabel={t.common.legalPlaceholder} />;
}
