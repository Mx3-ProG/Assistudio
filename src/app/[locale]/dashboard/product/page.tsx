import Link from "next/link";
import { Check, ExternalLink, Repeat } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatMoney, formatPercent } from "@/lib/money";
import { computeCommissionCents } from "@/lib/commission";
import { PageHeader, Card, Notice } from "@/components/ui/primitives";
import { ProductMockup } from "@/components/marketing/product-mockup";
import { buttonClass } from "@/components/ui/button";

/** Question: "What exactly am I selling?" */
export default async function Product({ params }: PageProps<"/[locale]/dashboard/product">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const offer = await repo().getOffer();
  const P = t.dash.product;
  const commission = computeCommissionCents(offer.priceCents, s.affiliate.commissionRate);

  return (
    <>
      <PageHeader
        title={P.title}
        subtitle={P.subtitle}
        action={<Link href={`/${locale}/studio`} target="_blank" className={buttonClass("secondary", "md")}><ExternalLink className="size-4" />{P.openPublicPage}</Link>}
      />
      <section className="card relative overflow-hidden p-6 sm:p-10">
        <div className="pointer-events-none absolute -end-20 -top-20 size-80 rounded-full bg-gradient-to-br from-accent/25 to-accent-2/25 blur-3xl" />
        <div className="relative grid gap-6 sm:grid-cols-3">
          {[
            [formatMoney(offer.priceCents, locale), t.common.perYear.replace("/", "").trim()],
            [formatPercent(s.affiliate.commissionRate, locale, 0), P.commission],
            [formatMoney(commission, locale), P.potential],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="tabular text-[40px] font-semibold tracking-[-0.04em] sm:text-[48px]">{v}</div>
              <div className="text-[14px] text-muted">{l}</div>
            </div>
          ))}
        </div>
        <p className="relative mt-8 max-w-2xl text-[17px] leading-relaxed text-fg-2">{t.meta.studioDescription}</p>
      </section>

      <section className="mt-8">
        <h2 className="mb-5 text-[20px] font-semibold tracking-tight">{P.demoTitle}</h2>
        <ProductMockup />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold">{P.featuresTitle}</h2>
          <ul className="mt-4 grid gap-3">
            {t.studio.features.map((f) => (
              <li key={f.title} className="flex gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                <span className="text-[14px]"><strong className="font-semibold">{f.title}.</strong> <span className="text-fg-2">{f.body}</span></span>
              </li>
            ))}
          </ul>
        </Card>
        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-[15px] font-semibold">{P.argumentsTitle}</h2>
            <ul className="mt-4 grid gap-2.5">{P.arguments.map((a) => <li key={a} className="rounded-xl bg-surface-2 p-3 text-[14px]">{a}</li>)}</ul>
          </Card>
          <Card className="p-6">
            <h2 className="text-[15px] font-semibold">{P.targetTitle}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-fg-2">{P.targetBody}</p>
          </Card>
        </div>
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Repeat className="size-4 text-accent" />{P.renewal}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-fg-2">{P.renewalBody}</p>
        </Card>
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold">{P.termsTitle}</h2>
          <ul className="mt-3 list-disc space-y-1.5 ps-5 text-[14px] text-fg-2">{P.terms.map((x) => <li key={x}>{x}</li>)}</ul>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-[20px] font-semibold tracking-tight">FAQ</h2>
        <div className="card divide-y divide-line">
          {t.studio.faq.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none text-[15px] font-medium">{f.q}</summary>
              <p className="mt-2 text-[14px] text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <div className="mt-6"><Notice>{t.common.illustrationOnly}</Notice></div>
    </>
  );
}
