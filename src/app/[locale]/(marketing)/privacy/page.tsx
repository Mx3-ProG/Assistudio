import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { InfoPage } from "@/components/marketing/info-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return pageMetadata(locale, "/privacy", `${t.pages.privacy.title} — STUDIO`, t.pages.privacy.title);
}

export default async function Page({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return <InfoPage title={t.pages.privacy.title} placeholder={t.pages.placeholderBody} placeholderLabel={t.common.legalPlaceholder} />;
}
