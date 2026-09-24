import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { PageHeader } from "@/components/ui/primitives";
import { SalesTable } from "@/components/dashboard/sales-table";

/** Question: "What did I sell?" */
export default async function Sales({ params }: PageProps<"/[locale]/dashboard/sales">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const sales = await repo().listSales(s);
  return (
    <>
      <PageHeader title={t.dash.sales.title} subtitle={t.dash.sales.subtitle} />
      <SalesTable sales={sales} />
    </>
  );
}
