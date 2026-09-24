import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { Footer } from "@/components/marketing/footer";
import { CookieBanner } from "@/components/marketing/cookie-banner";

export default async function MarketingLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);
  return (
    <>
      {children}
      <Footer t={t} locale={locale} />
      <CookieBanner />
    </>
  );
}
