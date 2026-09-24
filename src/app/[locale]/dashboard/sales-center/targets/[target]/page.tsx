import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { marketContent } from "@/content/markets";
import { salesContext, ofKind } from "@/lib/sales/server";
import { PageHeader, Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { BackLink } from "@/components/sales-center/back-link";

export default async function Target({ params }: PageProps<"/[locale]/dashboard/sales-center/targets/[target]">) {
  const { locale, target } = (await params) as { locale: Locale; target: string }; const s = await requireAffiliate(locale);
  const [t, ctx] = await Promise.all([getDictionary(locale), salesContext(s, locale)]); const m = ctx.marketBySlug(target); if (!m) notFound(); const c = marketContent(m, locale);
  const rows = [[t.sc.targets.who, c.who], [t.sc.targets.why, c.why], [t.sc.targets.angle, c.angle], [t.sc.targets.avoid, c.avoid]];
  const objections = ofKind(ctx.content, "objection").filter((x) => !x.targetKey || x.targetKey === target).slice(0, 4);
  return <div className="space-y-6"><BackLink href={`/${locale}/dashboard/sales-center/targets`} label={t.sc.back} /><PageHeader title={c.name} subtitle={c.problem} />
    <div className="grid gap-4 lg:grid-cols-2">{rows.map(([k,v]) => v && <section key={k} className="card p-5"><h2 className="text-[11px] font-semibold uppercase tracking-wider text-accent">{k}</h2><p className="mt-2 text-[15px] leading-relaxed">{v}</p></section>)}</div>
    {[t.sc.targets.pains, t.sc.targets.outcomes, t.sc.targets.discovery].map((title, i) => { const xs = [c.pains, c.outcomes, c.discovery][i]; return xs?.length ? <section key={title} className="card p-5"><h2 className="font-semibold">{title}</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2">{xs.map((x) => <li key={x} className="rounded-xl bg-surface-2 p-3 text-[14px]">{x}</li>)}</ul></section> : null; })}
    {objections.length > 0 && <section><h2 className="mb-3 font-semibold">{t.sc.targets.objections}</h2><div className="flex flex-wrap gap-2">{objections.map((o) => <Badge key={o.id}>{o.body.objection}</Badge>)}</div></section>}
    <div className="flex flex-wrap gap-2"><Link href={`/${locale}/dashboard/sales-center/start?target=${target}`} className={buttonClass("accent", "lg")}>{t.sc.startSelling}</Link><a href={ctx.urlForTarget(target)} target="_blank" rel="noopener" className={buttonClass("secondary", "lg")}><ExternalLink className="size-4" />{t.sc.targets.page}</a></div>
  </div>;
}
