import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { InfoPage } from "@/components/marketing/info-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/legal">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return pageMetadata(locale, "/legal", `${t.pages.legal.title} — STUDIO`, t.pages.legal.title);
}

export default async function Page({ params }: PageProps<"/[locale]/legal">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return <InfoPage title={t.pages.legal.title} placeholder={t.pages.placeholderBody} placeholderLabel={t.common.legalPlaceholder} />;
}
