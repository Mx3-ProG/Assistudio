import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { env } from "@/lib/env";
import { PageHeader } from "@/components/ui/primitives";
import { SalesKit } from "@/components/dashboard/sales-kit";

/** Question: "What should I say?" */
export default async function SalesKitPage({ params }: PageProps<"/[locale]/dashboard/sales-kit">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const assets = await repo().listSalesAssets(s, locale);
  return (
    <>
      <PageHeader title={t.dash.salesKit.title} subtitle={t.dash.salesKit.subtitle} />
      <SalesKit assets={assets} link={`${env.siteUrl}/s/${s.affiliate.slug ?? s.affiliate.code}`} />
    </>
  );
}
