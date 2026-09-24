import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { PageHeader } from "@/components/ui/primitives";
import { MarketEditor } from "@/components/admin/market-editor";

export default async function AdminMarkets({ params, searchParams }: PageProps<"/[locale]/admin/markets">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const editLocale: Locale = typeof sp.lang === "string" && isLocale(sp.lang) ? sp.lang : locale;
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const markets = await repo().adminListMarkets(s);
  return (
    <>
      <PageHeader title={t.admin.nav.markets} subtitle="Localised market cards shown on the homepage, in Find clients and in onboarding. No unsourced revenue or ROI figures." />
      <MarketEditor markets={markets} editLocale={editLocale} />
    </>
  );
}
