import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { LegalDocument } from "@/components/marketing/legal-document";
import { legalDocuments } from "@/content/legal";

export async function generateMetadata({ params }: PageProps<"/[locale]/legal">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const document = legalDocuments.legal;
  return pageMetadata(locale, "/legal", `${document.title} — Studio ATS`, document.description);
}

export default async function Page({ params }: PageProps<"/[locale]/legal">) {
  const { locale } = (await params) as { locale: Locale };
  return <LegalDocument document={legalDocuments.legal} locale={locale} />;
}
