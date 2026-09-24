import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { InfoPage } from "@/components/marketing/info-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/cookies">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return pageMetadata(locale, "/cookies", `${t.pages.cookies.title} — STUDIO`, t.pages.cookies.title);
}

export default async function Page({ params }: PageProps<"/[locale]/cookies">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return <InfoPage title={t.pages.cookies.title} placeholder={t.pages.placeholderBody} placeholderLabel={t.common.legalPlaceholder} />;
}
