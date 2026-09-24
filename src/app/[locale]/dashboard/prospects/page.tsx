import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { PageHeader } from "@/components/ui/primitives";
import { ProspectsBoard } from "@/components/dashboard/prospects-board";

/** Question: "Who should I contact next?" */
export default async function Prospects({ params, searchParams }: PageProps<"/[locale]/dashboard/prospects">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const [prospects, markets, links, offer, rules] = await Promise.all([repo().listProspects(s), repo().listMarkets(), repo().listLinks(s), repo().getOffer(), repo().getSalesSettings()]);
  const target = typeof sp.target === "string" ? markets.find((m) => m.slug === sp.target)?.id ?? null : null;
  return (
    <>
      <PageHeader title={t.dash.prospects.title} subtitle={t.dash.prospects.subtitle} />
      <ProspectsBoard
        prospects={prospects}
        markets={markets}
        campaigns={links.filter((l) => l.campaignId).map((l) => ({ id: l.campaignId!, name: l.name }))}
        defaultValueCents={offer.priceCents}
        rules={{ followUpDays: rules.followUpDays, checkoutCheckInDays: rules.checkoutCheckInDays, revisitLostDays: 90 }}
        // eslint-disable-next-line react-hooks/purity -- request-time snapshot for the suggestions
        now={Date.now()}
        initialNew={sp.new === "1"}
        initialMarketId={target}
      />
    </>
  );
}
