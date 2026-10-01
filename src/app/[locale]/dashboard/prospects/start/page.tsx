import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { marketContent } from "@/content/markets";
import { salesContext, ofKind } from "@/lib/sales/server";
import { BackLink } from "@/components/sales-center/back-link";
import { FirstSaleStarter } from "@/components/guided/first-sale-starter";

/** "I have a prospect" / "find a prospect": four questions, then the prospect's guided page. */
export default async function StartProspect({ params, searchParams }: PageProps<"/[locale]/dashboard/prospects/start">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const s = await requireAffiliate(locale);
  const [t, ctx] = await Promise.all([getDictionary(locale), salesContext(s, locale)]);
  const sectors = ctx.markets.map((m) => ({ slug: m.slug, name: marketContent(m, locale).name })).sort((a, b) => a.name.localeCompare(b.name, locale));
  const sources = ofKind(ctx.content, "find_source").map((x) => ({ key: x.key, title: x.title, how: x.body.how, action: x.body.action, tip: x.body.tip }));
  const sector = typeof sp.sector === "string" && sectors.some((x) => x.slug === sp.sector) ? sp.sector : "";
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href={`/${locale}/dashboard/sales-center`} label={t.cp.title} />
      <h1 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">{t.gd.home.title}</h1>
      <div className="card p-5 sm:p-7">
        <FirstSaleStarter sectors={sectors} sources={sources} initial={sp.mode === "no" ? "no" : "yes"} initialSector={sector} />
      </div>
    </div>
  );
}
