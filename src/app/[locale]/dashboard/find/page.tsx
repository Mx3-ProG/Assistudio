import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { PageHeader } from "@/components/ui/primitives";
import { FindClients } from "@/components/dashboard/find-clients";

/**
 * Question: "Who can I sell to?"
 * V0 = guidance only. Data-provider integrations (authorised sources) plug in later
 * behind a ProspectSource interface — no scraping.
 */
export default async function Find({ params }: PageProps<"/[locale]/dashboard/find">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const [markets, prospects] = await Promise.all([repo().listMarkets(), repo().listProspects(s)]);
  return (
    <>
      <PageHeader title={t.dash.find.title} subtitle={t.dash.find.subtitle} />
      <FindClients markets={markets} savedCount={prospects.filter((p) => p.stage !== "won" && p.stage !== "lost").length} />
    </>
  );
}
