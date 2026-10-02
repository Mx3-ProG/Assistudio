import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { LegalDocument } from "@/components/marketing/legal-document";
import { legalDocuments } from "@/content/legal";

export async function generateMetadata({ params }: PageProps<"/[locale]/cookies">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const document = legalDocuments.cookies;
  return pageMetadata(locale, "/cookies", `${document.title} — Studio ATS`, document.description);
}

export default async function Page({ params }: PageProps<"/[locale]/cookies">) {
  const { locale } = (await params) as { locale: Locale };
  return <LegalDocument document={legalDocuments.cookies} locale={locale} />;
}
