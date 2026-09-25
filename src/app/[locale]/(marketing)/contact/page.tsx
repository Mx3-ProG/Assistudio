import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { InfoPage } from "@/components/marketing/info-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return pageMetadata(locale, "/contact", `${t.pages.contact.title} — Studio ATS`, t.pages.contact.title);
}

export default async function Page({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return <InfoPage title={t.pages.contact.title} body={t.pages.contact.body} placeholder={t.pages.placeholderBody} placeholderLabel={t.common.legalPlaceholder} />;
}
