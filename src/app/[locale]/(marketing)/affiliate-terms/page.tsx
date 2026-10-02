import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { LegalDocument } from "@/components/marketing/legal-document";
import { legalDocuments } from "@/content/legal";

export async function generateMetadata({ params }: PageProps<"/[locale]/affiliate-terms">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const document = legalDocuments.affiliateTerms;
  return pageMetadata(locale, "/affiliate-terms", `${document.title} — Studio ATS`, document.description);
}

export default async function Page({ params }: PageProps<"/[locale]/affiliate-terms">) {
  const { locale } = (await params) as { locale: Locale };
  return <LegalDocument document={legalDocuments.affiliateTerms} locale={locale} />;
}
