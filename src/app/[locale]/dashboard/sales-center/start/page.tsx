import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { marketContent } from "@/content/markets";
import { salesContext, ofKind } from "@/lib/sales/server";
import { PageHeader } from "@/components/ui/primitives";
import { StartSelling } from "@/components/sales-center/start-selling";

export default async function StartPage({ params, searchParams }: PageProps<"/[locale]/dashboard/sales-center/start">) {
  const { locale } = (await params) as { locale: Locale };
  const q = await searchParams;
  const s = await requireAffiliate(locale);
  const [t, ctx] = await Promise.all([getDictionary(locale), salesContext(s, locale)]);
  const urls = Object.fromEntries([["", ctx.urlForTarget(null)], ...ctx.markets.map((m) => [m.slug, ctx.urlForTarget(m.slug)])]);
  const hasPage = Object.fromEntries(ctx.markets.map((m) => [m.slug, !!ctx.pageForTarget(m.slug)]));
  return <div className="space-y-6"><PageHeader title={t.sc.startSelling} subtitle={t.sc.startSellingHint} />
    <StartSelling targets={ctx.markets.map((m) => ({ slug: m.slug, icon: m.icon, relevance: m.relevance ?? 3, c: marketContent(m, locale) }))}
      messages={ofKind(ctx.content, "message")} emails={ofKind(ctx.content, "email_template")} scripts={ofKind(ctx.content, "call_script")}
      objections={ofKind(ctx.content, "objection")} playbooks={ofKind(ctx.content, "playbook")} urls={urls} hasPage={hasPage}
      advisorName={ctx.advisorName} initialTarget={typeof q.target === "string" ? q.target : null} /></div>;
}
