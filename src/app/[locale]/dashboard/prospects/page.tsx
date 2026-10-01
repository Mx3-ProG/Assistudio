import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { PageHeader } from "@/components/ui/primitives";
import { ProspectsBoard } from "@/components/dashboard/prospects-board";
import { nextActions } from "@/lib/sales/server";

/** Question: "Who should I contact next?" — each card opens the prospect's guided page. */
export default async function Prospects({ params, searchParams }: PageProps<"/[locale]/dashboard/prospects">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const [prospects, markets, links, offer, next] = await Promise.all([repo().listProspects(s), repo().listMarkets(), repo().listLinks(s), repo().getOffer(), nextActions(s, locale)]);
  const target = typeof sp.target === "string" ? markets.find((m) => m.slug === sp.target)?.id ?? null : null;
  return (
    <>
      <PageHeader title={t.dash.prospects.title} subtitle={t.dash.prospects.subtitle} />
      <ProspectsBoard
        prospects={prospects}
        markets={markets}
        campaigns={links.filter((l) => l.campaignId).map((l) => ({ id: l.campaignId!, name: l.name }))}
        defaultValueCents={offer.priceCents}
        nextLabels={Object.fromEntries(next.filter((n) => n.label).map((n) => [n.prospect.id, n.label!]))}
        initialEdit={typeof sp.edit === "string" ? sp.edit : null}
        initialNew={sp.new === "1"}
        initialMarketId={target}
      />
    </>
  );
}
