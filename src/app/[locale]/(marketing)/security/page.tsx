import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { Navbar } from "@/components/marketing/navbar";
import { SecurityContent } from "@/components/marketing/security-content";
import { getSecurityPageCopy } from "@/lib/marketing/trust-pages-copy";

export async function generateMetadata({ params }: PageProps<"/[locale]/security">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  const copy = getSecurityPageCopy(locale);
  return pageMetadata(locale, "/security", `${t.pages.security.title} — Studio ATS`, copy.intro);
}

export default async function Page({ params }: PageProps<"/[locale]/security">) {
  const { locale } = (await params) as { locale: Locale };
  await getDictionary(locale);
  const copy = getSecurityPageCopy(locale);
  return <><Navbar variant="studio" studioCtaHref={`/${locale}/studio#request`} /><main><SecurityContent copy={copy} locale={locale} /></main></>;
}
