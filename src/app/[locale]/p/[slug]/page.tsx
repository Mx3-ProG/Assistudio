import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { repo } from "@/lib/data";
import { isValidCode } from "@/lib/attribution";
import { marketContent } from "@/content/markets";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { StudioContent } from "@/components/marketing/studio-content";
import { clientProofData } from "@/lib/proof-server";
import { PageBeacon } from "@/components/marketing/page-beacon";
import { I18nProvider } from "@/components/providers";

// Private sales pages: never indexed, never in the sitemap, never cached publicly.
export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };

export default async function PrivateSalesPage({ params }: PageProps<"/[locale]/p/[slug]">) {
  const { slug } = await params;
  if (!isValidCode(slug)) notFound();
  const page = await repo().getPrivatePage(slug);
  if (!page) notFound();

  // The page's own language wins over the URL locale.
  const locale = page.locale as Locale;
  const t = await getDictionary(locale);
  const [offers, markets, settings, proof] = await Promise.all([repo().listOffers(), repo().listMarkets(), repo().getSettings(), clientProofData(locale, "client")]);
  const market = markets.find((m) => m.id === page.marketId);

  return (
    <I18nProvider locale={locale} dict={t}>
    <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <PageBeacon slug={page.slug} />
      <Navbar variant="studio" />
      <StudioContent
        t={t}
        locale={locale}
        offers={offers}
        settings={settings}
        page={page.slug}
        referrerName={page.displayName ?? page.referral.displayName}
        market={market ? marketContent(market, locale) : null}
        pitch={page.pitchVariant}
        ctaVariant={page.ctaVariant}
        proof={proof}
      />
      <Footer t={t} locale={locale} />
    </div>
    </I18nProvider>
  );
}
