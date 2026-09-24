import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { marketContent } from "@/content/markets";
import { salesContext } from "@/lib/sales/server";
import { PageHeader, Badge } from "@/components/ui/primitives";
import { MarketIcon } from "@/components/marketing/markets-grid";

export default async function Targets({ params }: PageProps<"/[locale]/dashboard/sales-center/targets">) {
  const { locale } = (await params) as { locale: Locale }; const s = await requireAffiliate(locale);
  const [t, ctx] = await Promise.all([getDictionary(locale), salesContext(s, locale)]);
  return <div className="space-y-6"><PageHeader title={t.sc.targets.title} subtitle={t.sc.targets.subtitle} />
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ctx.markets.map((m) => { const c = marketContent(m, locale); return <li key={m.id}>
      <Link href={`/${locale}/dashboard/sales-center/targets/${m.slug}`} className="card flex h-full flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent"><MarketIcon name={m.icon} className="size-5" /></span><h2 className="font-semibold">{c.name}</h2><Badge className="ms-auto">{t.sc.targets.relevanceLevels[m.relevance ?? 3]}</Badge></div>
        <p className="text-[14px] text-fg-2">{c.who}</p><p className="mt-auto flex items-center gap-1 text-[13px] font-medium text-accent">{t.sc.open}<ArrowRight className="flip-rtl size-4" /></p>
      </Link></li>; })}</ul></div>;
}
