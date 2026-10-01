import { Check, X } from "lucide-react";
import { getDictionary } from "@/i18n";
import { fmt } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatMoney, formatPercent } from "@/lib/money";
import { salesContext, ofKind } from "@/lib/sales/server";
import { PageHeader } from "@/components/ui/primitives";
import { BackLink } from "@/components/sales-center/back-link";
import { FactsList } from "@/components/guided/facts-list";

/**
 * Studio's source of truth for ambassadors: live official figures (catalogue
 * + settings), what may / may not be promised, and the official answers.
 */
export default async function FactsPage({ params }: PageProps<"/[locale]/dashboard/sales-center/facts">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const [t, ctx, offers, settings] = await Promise.all([getDictionary(locale), salesContext(s, locale), repo().listOffers(), repo().getSettings()]);
  const F = t.gd.facts;
  const facts = ofKind(ctx.content, "fact");
  const promises = facts.find((f) => f.body.category === "promises");
  const rest = facts.filter((f) => f !== promises).map((f) => ({ key: f.key, category: f.body.category, question: f.body.question, answer: f.body.answer, level: f.body.level }));
  const cell = (label: string, value: string) => (
    <div key={label} className="rounded-2xl bg-surface-2 p-3"><p className="text-[12px] text-muted">{label}</p><p className="tabular mt-1 text-[16px] font-semibold">{value}</p></div>
  );
  return (
    <div className="space-y-6">
      <BackLink href={`/${locale}/dashboard/sales-center`} label={t.cp.title} />
      <PageHeader title={F.title} subtitle={F.subtitle} />
      <section className="card p-5 sm:p-6">
        <h2 className="mb-3 text-[15px] font-semibold">{F.live}</h2>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {offers.map((o) => cell(`${F.price} · ${t.pricing.plans[o.tier].name}`, `${formatMoney(o.priceCents, locale, o.currency)} ${o.interval === "one_time" ? t.pricing.oneTime : t.pricing.perYear}`))}
          {cell(F.yourRate, formatPercent(s.affiliate.commissionRate, locale, 0))}
          {cell(F.sponsorRate, formatPercent(settings.sponsorRate, locale, 0))}
          {cell(F.validation, fmt(F.days, { n: settings.commissionValidationDays }))}
          {cell(F.payoutMin, formatMoney(settings.payoutMinimumCents, locale))}
        </div>
      </section>
      {promises && (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="card border-success/30 p-5">
            <h2 className="font-semibold text-success">{F.can}</h2>
            <ul className="mt-3 grid gap-2">{promises.body.can?.map((x) => <li key={x} className="flex gap-2 text-[14.5px]"><Check className="mt-0.5 size-4 shrink-0 text-success" />{x}</li>)}</ul>
          </div>
          <div className="card border-danger/30 p-5">
            <h2 className="font-semibold text-danger">{F.cannot}</h2>
            <ul className="mt-3 grid gap-2">{promises.body.cannot?.map((x) => <li key={x} className="flex gap-2 text-[14.5px]"><X className="mt-0.5 size-4 shrink-0 text-danger" />{x}</li>)}</ul>
          </div>
          <p className="text-[13.5px] text-muted md:col-span-2">{promises.body.answer}</p>
        </section>
      )}
      <FactsList facts={rest} />
    </div>
  );
}
