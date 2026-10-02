import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Mail, Phone } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { repo } from "@/lib/data";
import type { Offer } from "@/lib/data/types";
import { isValidCode } from "@/lib/attribution";
import { marketContent, type MarketContent } from "@/content/markets";
import { pickLocale, forTarget, isKind } from "@/lib/sales/content";
import { composeLanding, cleanAdvisor } from "@/lib/sales/landing";
import { formatMoney } from "@/lib/money";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { PageBeacon } from "@/components/marketing/page-beacon";
import { LeadForm } from "@/components/marketing/lead-form";
import { CheckoutButton } from "@/components/marketing/checkout-button";
import { I18nProvider } from "@/components/providers";
import { PublicCta } from "@/components/sales-center/public-cta";
import { StudioContent } from "@/components/marketing/studio-content";

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };

export default async function AffiliateSalesPage({ params }: PageProps<"/[locale]/a/[affiliate]/[[...target]]">) {
  const { locale: requestedLocale, affiliate, target } = await params;
  if (!isValidCode(affiliate) || (target?.length ?? 0) > 1) notFound();
  const pathKey = target?.[0] ?? null;
  const r = repo();
  const page = await r.getSalesPage(affiliate, pathKey);
  if (!page) {
    const referral = await r.resolveReferral(affiliate);
    if (!referral?.active) notFound();
    const locale = requestedLocale as Locale;
    const [t, offers, markets] = await Promise.all([getDictionary(locale), r.listOffers(), r.listMarkets()]);
    const market = pathKey ? markets.find((m) => m.slug === pathKey) : null;
    if (pathKey && !market) notFound();
    return <FallbackAffiliatePage t={t} locale={locale} offers={offers} referrerName={referral.displayName}
      market={market ? marketContent(market, locale) : null} referral={affiliate}/>;
  }
  const locale = page.locale as Locale;
  const [t, all, markets, products, offers] = await Promise.all([
    getDictionary(locale),
    r.listPublishedContent(["page_template", "page_variant", "sales_angle", "knowledge", "objection"]),
    r.listMarkets(), r.listProducts(), r.listOffers(),
  ]);
  const content = pickLocale(all, locale);
  const template = content.find((x) => isKind(x, "page_template") && x.key === page.templateKey);
  const market = markets.find((m) => m.id === page.marketId) ?? null;
  // Stale or not-yet-seeded content must not turn a valid affiliate URL into a
  // 404. The automatic Studio page remains available while content is fixed.
  if (!template || !isKind(template, "page_template")) {
    return <FallbackAffiliatePage t={t} locale={locale} offers={offers} referrerName={page.referral.displayName}
      market={market ? marketContent(market, locale) : null} slug={page.slug}/>;
  }
  const targetKey = market?.slug ?? null;
  const variant = forTarget(content.filter((x) => isKind(x, "page_variant")), targetKey)
    .find((x) => x.body.template === template.key) ?? null;
  const angle = page.angleKey ? content.find((x) => isKind(x, "sales_angle") && x.key === page.angleKey) : null;
  const knowledge = forTarget(content.filter((x) => isKind(x, "knowledge")), targetKey);
  const included = knowledge.filter((x) => x.body.section === "included").flatMap((x) => x.body.items.filter((i) => i.availability !== "not_included").map((i) => `${i.title} — ${i.body}`));
  const faq = forTarget(content.filter((x) => isKind(x, "objection")), targetKey).slice(0, 6).map((x) => ({ q: x.body.objection, a: x.body.long }));
  const product = products.find((p) => p.id === page.productId) ?? products.find((p) => p.active) ?? null;
  const offer = product?.offer ? { productName: product.name, priceCents: product.offer.priceCents, currency: product.offer.currency, interval: product.offer.interval } : null;
  const model = composeLanding({
    template: template.body, variant: variant?.body, angle: angle && isKind(angle, "sales_angle") ? angle.body : null,
    target: market ? marketContent(market, locale) : null, offer, included, faq, requestedCta: page.ctaMode,
    canBuy: !!product?.offer?.checkoutReady, advisor: page.showAdvisor ? cleanAdvisor(page.advisor) : null,
  });
  const requestType = model.cta === "call" ? "call" : model.cta === "quote" ? "quote" : model.cta === "question" ? "question" : "info";
  const ctaLabel = model.cta === "buy" ? t.sc.landing.buy : t.sc.landing.requestTitle[model.cta];
  const origin = `/a/${affiliate}${pathKey ? `/${pathKey}` : ""}`;

  return <I18nProvider locale={locale} dict={t}><div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
    <PageBeacon slug={page.slug} /><Navbar variant="studio" />
    <main>
      <section className="relative overflow-hidden border-b border-line px-4 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--accent-soft),transparent_55%)]" />
        <div className="relative mx-auto max-w-4xl text-center">{model.hero.eyebrow&&<p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-accent">{model.hero.eyebrow}</p>}<h1 className="mt-4 text-balance text-[42px] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-[64px]">{model.hero.title}</h1><p className="mx-auto mt-6 max-w-2xl text-[18px] leading-relaxed text-fg-2">{model.hero.subtitle}</p><div className="mt-8 flex justify-center"><PublicCta page={page.slug} href={model.cta === "buy" ? "#buy" : "#contact"} label={ctaLabel}/></div></div>
      </section>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">{model.sections.map((section, index) => {
        if(section.type==="problem")return <Section key={index} title={section.title}><p>{section.body}</p><Points items={section.points}/></Section>;
        if(section.type==="solution")return <Section key={index} title={section.title}><p>{section.body}</p></Section>;
        if(section.type==="value"||section.type==="included")return <Section key={index} title={section.title}><Points items={section.items}/></Section>;
        if(section.type==="how")return <Section key={index} title={section.title}><div className="grid gap-3 sm:grid-cols-3">{section.steps.map((x,n)=><article key={x.title} className="rounded-2xl bg-surface-2 p-5"><span className="text-[12px] font-semibold text-accent">{n+1}</span><h3 className="mt-2 font-semibold">{x.title}</h3><p className="mt-2 text-[14px] text-fg-2">{x.body}</p></article>)}</div></Section>;
        if(section.type==="benefits")return <Section key={index} title={section.title}><div className="grid gap-3 sm:grid-cols-2">{section.items.map(x=><article key={x.title} className="rounded-2xl border border-line p-5"><h3 className="font-semibold">{x.title}</h3><p className="mt-2 text-[14px] text-fg-2">{x.body}</p></article>)}</div></Section>;
        if(section.type==="who")return <Section key={index} title={section.title}><p>{section.audience??section.body}</p></Section>;
        if(section.type==="faq")return <Section key={index} title={section.title}><div className="grid gap-2">{section.items.map(x=><details key={x.q} className="rounded-2xl border border-line p-4"><summary className="cursor-pointer font-medium">{x.q}</summary><p className="mt-3 text-[14px] text-fg-2">{x.a}</p></details>)}</div></Section>;
        if(section.type==="offer")return <Section key={index} title={section.title}><div id="buy" className="card p-6 text-center sm:p-8">{section.offer?<><p className="text-[34px] font-semibold">{formatMoney(section.offer.priceCents,locale,section.offer.currency)}</p><p className="text-[13px] text-muted">{t.sc.landing.perInterval[section.offer.interval]}</p></>:<p>{t.sc.landing.onRequest}</p>}<p className="mx-auto mt-3 max-w-xl text-[14px] text-fg-2">{section.note}</p>{model.cta==="buy"&&product?.offer?.checkoutReady&&<CheckoutButton locale={locale} page={page.slug} origin={origin} offer="premium" billingChoices={{ label: t.checkout.billingCadence, monthly: t.checkout.monthly, annual: t.checkout.annual }} label={t.sc.landing.buy} pendingLabel={t.sc.landing.buyPending}/>}</div></Section>;
        if(section.type==="cta")return <Section key={index} title={section.title}><p>{section.body}</p></Section>;
        return null;
      })}
      {model.advisor&&<section className="mb-12 rounded-3xl bg-surface-2 p-6 sm:p-8"><p className="text-[12px] font-semibold uppercase tracking-wider text-accent">{t.sc.landing.advisorTitle}</p><h2 className="mt-2 text-[22px] font-semibold">{model.advisor.name}</h2>{model.advisor.title&&<p className="text-fg-2">{model.advisor.title}</p>}<div className="mt-4 flex flex-wrap gap-4 text-[14px]">{model.advisor.email&&<a href={`mailto:${model.advisor.email}`} className="flex items-center gap-2"><Mail className="size-4"/>{model.advisor.email}</a>}{model.advisor.phone&&<a href={`tel:${model.advisor.phone}`} className="flex items-center gap-2"><Phone className="size-4"/>{model.advisor.phone}</a>}</div></section>}
      <section id="contact" className="scroll-mt-20 rounded-3xl border border-line bg-bg-elevated p-6 sm:p-10"><h2 className="text-[26px] font-semibold">{t.sc.landing.requestTitle[model.cta]}</h2><div className="mt-6"><LeadForm page={page.slug} requestType={requestType} advisorName={model.advisor?.name} /></div></section>
      <p className="mt-8 text-center text-[12px] text-muted">{t.sc.landing.footerNote}</p></div>
    </main><Footer t={t} locale={locale}/>
  </div></I18nProvider>;
}

function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="mb-16"><h2 className="mb-5 text-[28px] font-semibold tracking-tight sm:text-[34px]">{title}</h2><div className="text-[16px] leading-relaxed text-fg-2">{children}</div></section>}
function Points({items}:{items:string[]}){return items.length?<ul className="mt-5 grid gap-3 sm:grid-cols-2">{items.map(x=><li key={x} className="flex gap-3 rounded-2xl bg-surface-2 p-4"><Check className="mt-0.5 size-4 shrink-0 text-success"/><span>{x}</span></li>)}</ul>:null}

function FallbackAffiliatePage({ t, locale, offers, referrerName, market, slug, referral }: {
  t: Dictionary; locale: Locale; offers: Offer[]; referrerName: string | null; market: MarketContent | null;
  slug?: string; referral?: string;
}) {
  return <I18nProvider locale={locale} dict={t}><div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
    <PageBeacon slug={slug} referral={referral} /><Navbar variant="studio" />
    <StudioContent t={t} locale={locale} offers={offers} page={slug} referrerName={referrerName}
      market={market} pitch="default" ctaVariant="request" />
    <Footer t={t} locale={locale}/>
  </div></I18nProvider>;
}
