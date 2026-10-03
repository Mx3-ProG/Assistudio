import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { Navbar } from "@/components/marketing/navbar";
import { ContactNewsletter } from "@/components/marketing/contact-newsletter";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return pageMetadata(locale, "/contact", `${t.pages.contact.title} — Studio ATS`, t.pages.contact.title);
}

export default async function Page({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return <><Navbar /><main><ContactNewsletter t={t} source="contact" /></main></>;
}
