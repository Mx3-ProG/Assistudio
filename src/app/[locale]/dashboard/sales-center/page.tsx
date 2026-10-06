import Link from "next/link";
import QRCode from "qrcode";
import {
  Compass, BookOpenCheck, MessageSquareText, Mail, Phone, ShieldQuestion, Package, FolderOpen,
  PanelsTopLeft, Link2, Megaphone, BarChart3, Star, CalendarCheck, Search, UserRound, Send, Repeat, ShoppingBag, Wallet, Sparkles, ChevronDown, BookOpen, Radar,
} from "lucide-react";
import { getDictionary } from "@/i18n";
import { fmt } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { salesContext, ofKind, searchDocs, followUps, sectorOptions } from "@/lib/sales/server";
import { SalesSearch } from "@/components/sales-center/sc-search";
import { FirstWeek } from "@/components/sales-center/first-week";
import { SectorSearch } from "@/components/copilot/sector-search";
import { AmbassadorKit } from "@/components/copilot/ambassador-kit";
import { FirstVisitHint } from "@/components/help/first-visit-hint";
import { publicTestimonials } from "@/lib/proof-server";
import { Testimonials } from "@/components/proof/testimonials";

/** The copilot: "What do you want to do?" — one question, seven answers, the toolbox one tap below. */
export default async function SalesCenter({ params }: PageProps<"/[locale]/dashboard/sales-center">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const [ctx, progress, fu] = await Promise.all([salesContext(s, locale), repo().listProgress(s), followUps(s, locale, t)]);
  const qr = await QRCode.toDataURL(ctx.defaultLink, { margin: 1, width: 256, color: { dark: "#111114", light: "#ffffff" } });
  const base = `/${locale}/dashboard/sales-center`;
  const dash = `/${locale}/dashboard`;
  const I = t.cp.intents;
  const S = t.sc.sections;
  const journey = ofKind(ctx.content, "journey")[0];
  const sectors = sectorOptions(ctx.markets, locale);

  const intents: { href: string; icon: typeof Search; title: string; body: string; badge?: number; primary?: boolean }[] = [
    { href: `${dash}/prospects/start?mode=no`, icon: Search, ...I.find },
    { href: `${dash}/prospects/start`, icon: UserRound, ...I.have, primary: true },
    { href: `${base}/assets`, icon: Send, ...I.send },
    { href: `${base}/objections`, icon: ShieldQuestion, ...I.objection },
    { href: `${base}/follow-ups`, icon: Repeat, ...I.followUp, badge: fu.due.length },
    { href: `${dash}/sales`, icon: ShoppingBag, ...I.sales },
    { href: `${dash}/commissions`, icon: Wallet, ...I.commissions },
    { href: `${base}/pitch`, icon: Sparkles, ...I.understand },
    { href: `${base}/signals`, icon: Radar, ...I.signal },
    { href: `${base}/facts`, icon: BookOpen, title: t.gd.nav.facts, body: t.gd.facts.subtitle },
  ];
  const toolbox = [
    { href: `${base}/start`, icon: Compass, ...S.start },
    { href: `${base}/playbooks`, icon: BookOpenCheck, ...S.playbooks },
    { href: `${base}/signals`, icon: Radar, ...S.signals },
    { href: `${base}/messages`, icon: MessageSquareText, ...S.messages },
    { href: `${base}/emails`, icon: Mail, ...S.emails },
    { href: `${base}/calls`, icon: Phone, ...S.calls },
    { href: `${base}/product`, icon: Package, ...S.product },
    { href: `${base}/assets`, icon: FolderOpen, ...S.assets },
    { href: `${base}/pages`, icon: PanelsTopLeft, ...S.pages },
    { href: `${dash}/link`, icon: Link2, ...S.links },
    { href: `${dash}/campaigns`, icon: Megaphone, ...S.campaigns },
    { href: `${base}/performance`, icon: BarChart3, ...S.performance },
    { href: `${base}/favorites`, icon: Star, ...S.favorites },
    { href: `${base}/first-week`, icon: CalendarCheck, ...S.firstWeek },
  ];

  // Client reviews staff placed in the Sales Center: proof the partner can show a prospect.
  const proof = await publicTestimonials({ placement: "sales_center", limit: 9 });
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{t.cp.title}</p>
        <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.035em] sm:text-[38px]">{t.cp.ask}</h1>
      </header>
      <FirstVisitHint id="/dashboard/sales-center" text={t.hp.hints.salesCenter} />

      <section className="card relative overflow-hidden border-accent/30 p-5 sm:p-6">
        <div className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-accent/15 blur-3xl" />
        <p className="relative mb-3 text-[15px] font-semibold">{t.cp.sector.label}</p>
        <div className="relative"><SectorSearch sectors={sectors} popular={sectors.slice(0, 6)} /></div>
      </section>

      <section data-tour="sales-intents" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-3">
        {intents.map(({ href, icon: Icon, title, body, badge, primary }) => (
          <Link key={title} href={href}
            className={`card relative flex flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${primary ? "border-accent/40 bg-accent-soft" : ""}`}>
            <Icon className="size-5 text-accent" />
            <span className="text-[15px] font-semibold leading-tight">{title}</span>
            <span className="text-[12.5px] leading-snug text-muted">{body}</span>
            {!!badge && <span className="tabular absolute end-3 top-3 rounded-full bg-warning px-2 py-0.5 text-[11px] font-semibold text-white">{fmt(t.cp.dueBadge, { n: badge })}</span>}
          </Link>
        ))}
      </section>

      <div data-tour="sales-kit"><AmbassadorKit t={t} base={dash} link={ctx.defaultLink} code={s.affiliate.code} qr={qr} /></div>

      <div>
        <SalesSearch docs={searchDocs(ctx.content, ctx.markets, locale)} />
        <p className="mt-2 px-1 text-[12px] text-muted">{t.sc.searchHint}</p>
      </div>

      <details className="group">
        <summary className="flex cursor-pointer select-none list-none items-center gap-2 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
          {t.cp.toolbox}<ChevronDown className="size-4 text-muted transition group-open:rotate-180" />
        </summary>
        <section className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {toolbox.map(({ href, icon: Icon, title, body }) => (
            <Link key={href} href={href} className="card flex flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
              <Icon className="size-5 text-accent" />
              <span className="text-[15px] font-semibold leading-tight">{title}</span>
              <span className="hidden text-[12.5px] leading-snug text-muted sm:block">{body}</span>
            </Link>
          ))}
        </section>
      </details>

      {journey && (
        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold"><CalendarCheck className="size-4 text-accent" />{journey.title}</h2>
            <Link href={`${base}/first-week`} className="text-[13px] text-accent hover:underline">{t.common.viewAll}</Link>
          </div>
          <FirstWeek journeyKey={journey.key} body={journey.body} done={progress} compact />
        </section>
      )}

      <Testimonials items={proof} title={t.pf.testimonials.title} subtitle={t.pf.testimonials.subtitle} />
    </div>
  );
}
