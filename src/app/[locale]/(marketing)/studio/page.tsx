import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { repo } from "@/lib/data";
import { pageMetadata, JsonLd } from "@/lib/seo";
import { env } from "@/lib/env";
import { Navbar } from "@/components/marketing/navbar";
import { StudioContent } from "@/components/marketing/studio-content";

export async function generateMetadata({ params }: PageProps<"/[locale]/studio">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return pageMetadata(locale, "/studio", t.meta.studioTitle, t.meta.studioDescription);
}

export default async function StudioPage({ params }: PageProps<"/[locale]/studio">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  const offers = await repo().listOffers();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Studio ATS",
          description: t.meta.studioDescription,
          brand: { "@type": "Brand", name: "Studio ATS" },
          offers: offers.map((o) => ({
            "@type": "Offer",
            name: t.pricing.plans[o.tier].name,
            price: (o.priceCents / 100).toFixed(2),
            priceCurrency: o.currency,
            url: `${env.siteUrl}/${locale}/pricing`,
            availability: "https://schema.org/InStock",
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: t.studio.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <Navbar variant="studio" />
      <StudioContent t={t} locale={locale} offers={offers} />
    </>
  );
}
