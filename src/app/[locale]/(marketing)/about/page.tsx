import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { Navbar } from "@/components/marketing/navbar";
import { AboutContent } from "@/components/marketing/about-content";
import { getAboutPageCopy } from "@/lib/marketing/trust-pages-copy";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  const copy = getAboutPageCopy(locale);
  return pageMetadata(locale, "/about", `${t.pages.about.title} — Studio ATS`, copy.intro);
}

export default async function Page({ params }: PageProps<"/[locale]/about">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  const copy = getAboutPageCopy(locale);
  return <><Navbar variant="studio" studioCtaHref={`/${locale}/studio#request`} /><main><AboutContent copy={copy} locale={locale} t={t} /></main></>;
}
