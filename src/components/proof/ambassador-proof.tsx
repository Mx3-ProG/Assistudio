import { BadgeCheck, CircleCheck } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { formatMoney } from "@/lib/money";
import { simulateFlow, type PublicProofEvent, type PublicTestimonial } from "@/lib/proof";
import { SectionHead } from "@/components/marketing/home/section-head";
import { cn } from "@/lib/cn";
import { DemoBadge } from "./badges";
import { MoneyFlow } from "./money-flow";
import { Testimonials } from "./testimonials";
import { monthLabel, eventLabel } from "./proof-feed";

/**
 * Partner-facing proof: how a recommendation becomes a payment (labelled
 * simulation computed from the real offer) → real, anonymised payout proofs
 * when staff published some → partners in their own words.
 */
export function AmbassadorProof({ t, locale, offer, validationDays, events, testimonials, id = "money-flow", className }: {
  t: Dictionary; locale: Locale;
  offer: { name: string; priceCents: number; commissionRate: number; currency: string };
  validationDays: number; events: PublicProofEvent[]; testimonials: PublicTestimonial[]; id?: string; className?: string;
}) {
  const A = t.pf.amb;
  const B = t.pf.badge;
  const sim = simulateFlow(offer);
  const payouts = events.filter((e) => e.type === "commission_paid" && e.valueCents != null);

  return (
    <section id={id} className={cn("scroll-mt-20 py-14 sm:py-24", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead eyebrow={A.eyebrow} title={A.title} subtitle={A.subtitle} />

        <div className="proof-reveal mt-10 rounded-[28px] border border-line bg-surface p-5 shadow-soft sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <DemoBadge label={B.simulation} hint={B.exampleHint} />
            <p className="text-[12.5px] text-muted">{fmt(A.validation, { days: validationDays })}</p>
          </div>
          <MoneyFlow steps={sim.steps} currency={offer.currency} />
          <p className="mt-6 border-t border-line pt-4 text-[12.5px] leading-relaxed text-muted">{fmt(A.simulation, { offer: offer.name })}</p>
        </div>

        <div className="mt-12">
          <h3 className="text-[22px] font-semibold tracking-tight sm:text-[26px]">{A.moneyTitle}</h3>
          <p className="mt-1.5 text-[14.5px] text-muted">{payouts.length ? A.moneySubtitle : A.moneyEmpty}</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {payouts.length ? payouts.map((e) => (
              <li key={e.id} className="proof-reveal">
                <PayoutCard label={A.paidLabel} amount={formatMoney(e.valueCents!, locale, e.currency ?? "EUR")} status={A.paymentDone}
                  who={eventLabel(t, e)} when={monthLabel(e.month, locale)}
                  badge={<span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success"><BadgeCheck className="size-4" aria-hidden />{B.verifiedPayment}</span>} />
              </li>
            )) : (
              <li className="proof-reveal">
                <PayoutCard label={A.paidLabel} amount={formatMoney(sim.commissionCents, locale, offer.currency)} status={A.paymentDone}
                  who={A.partner} when={offer.name} dashed badge={<DemoBadge label={B.simulation} hint={B.exampleHint} />} />
              </li>
            )}
          </ul>
        </div>

        <Testimonials items={testimonials} title={A.testimonialsTitle} subtitle={t.pf.testimonials.subtitle} className="mt-14" />
      </div>
    </section>
  );
}

function PayoutCard({ label, amount, status, who, when, badge, dashed }: {
  label: string; amount: string; status: string; who: string; when: string; badge: React.ReactNode; dashed?: boolean;
}) {
  return (
    <div className={cn("card p-5 transition duration-300 hover:-translate-y-0.5", dashed && "border-dashed")}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="tabular mt-1 text-[32px] font-semibold tracking-[-0.03em]">{amount}</p>
      <p className="mt-2 flex items-center gap-1.5 text-[13.5px] font-medium"><CircleCheck className="size-4 text-success" aria-hidden />{status}</p>
      <p className="mt-0.5 text-[12.5px] text-muted">{who} · {when}</p>
      <div className="mt-3">{badge}</div>
    </div>
  );
}
