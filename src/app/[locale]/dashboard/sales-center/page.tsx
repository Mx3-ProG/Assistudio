import Link from "next/link";
import {
  ArrowRight, Compass, BookOpenCheck, MessageSquareText, Mail, Phone, ShieldQuestion, Package, FolderOpen,
  PanelsTopLeft, Link2, Megaphone, BarChart3, Star, CalendarCheck, Rocket,
} from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { salesContext, ofKind, searchDocs } from "@/lib/sales/server";
import { PageHeader } from "@/components/ui/primitives";
import { SalesSearch } from "@/components/sales-center/sc-search";
import { FirstWeek } from "@/components/sales-center/first-week";
import { QuickActions } from "@/components/sales-center/quick-actions";

/** "Everything you need to sell STUDIO." */
export default async function SalesCenter({ params }: PageProps<"/[locale]/dashboard/sales-center">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const [ctx, progress] = await Promise.all([salesContext(s, locale), repo().listProgress(s)]);
  const base = `/${locale}/dashboard/sales-center`;
  const S = t.sc.sections;
  const journey = ofKind(ctx.content, "journey")[0];
  const sections = [
    { href: `${base}/targets`, icon: Compass, ...S.targets },
    { href: `${base}/playbooks`, icon: BookOpenCheck, ...S.playbooks },
    { href: `${base}/messages`, icon: MessageSquareText, ...S.messages },
    { href: `${base}/emails`, icon: Mail, ...S.emails },
    { href: `${base}/calls`, icon: Phone, ...S.calls },
    { href: `${base}/objections`, icon: ShieldQuestion, ...S.objections },
    { href: `${base}/product`, icon: Package, ...S.product },
    { href: `${base}/assets`, icon: FolderOpen, ...S.assets },
    { href: `${base}/pages`, icon: PanelsTopLeft, ...S.pages },
    { href: `/${locale}/dashboard/link`, icon: Link2, ...S.links },
    { href: `/${locale}/dashboard/campaigns`, icon: Megaphone, ...S.campaigns },
    { href: `${base}/performance`, icon: BarChart3, ...S.performance },
    { href: `${base}/favorites`, icon: Star, ...S.favorites },
    { href: `${base}/first-week`, icon: CalendarCheck, ...S.firstWeek },
  ];
  const general = ctx.pageForTarget(null) ?? ctx.pages[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title={t.sc.title} subtitle={t.sc.subtitle} />

      <Link href={`${base}/start`} className="card group relative flex items-center gap-4 overflow-hidden border-accent/30 p-5 transition hover:shadow-lift sm:p-7">
        <div className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-accent/20 blur-3xl" />
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-accent-fg shadow-[0_8px_24px_-8px_var(--accent)]"><Rocket className="size-6" /></span>
        <span className="relative min-w-0 flex-1">
          <span className="block text-[20px] font-semibold tracking-tight sm:text-[24px]">{t.sc.startSelling}</span>
          <span className="mt-0.5 block text-[14px] text-muted">{t.sc.startSellingHint}</span>
        </span>
        <ArrowRight className="flip-rtl relative size-5 text-accent transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
      </Link>

      <div>
        <SalesSearch docs={searchDocs(ctx.content, ctx.markets, locale)} />
        <p className="mt-2 px-1 text-[12px] text-muted">{t.sc.searchHint}</p>
      </div>

      <QuickActions link={ctx.defaultLink} pageUrl={general ? ctx.urlForTarget(null) : null} />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sections.map(({ href, icon: Icon, title, body }) => (
          <Link key={href} href={href} className="card flex flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
            <Icon className="size-5 text-accent" />
            <span className="text-[15px] font-semibold leading-tight">{title}</span>
            <span className="hidden text-[12.5px] leading-snug text-muted sm:block">{body}</span>
          </Link>
        ))}
      </section>

      {journey && (
        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold"><CalendarCheck className="size-4 text-accent" />{journey.title}</h2>
            <Link href={`${base}/first-week`} className="text-[13px] text-accent hover:underline">{t.common.viewAll}</Link>
          </div>
          <FirstWeek journeyKey={journey.key} body={journey.body} done={progress} compact />
        </section>
      )}
    </div>
  );
}
