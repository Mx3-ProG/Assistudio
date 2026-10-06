import { BadgeCheck, Banknote, MessageSquareQuote, Sparkles } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/money";
import type { ProofEventType, PublicProofEvent } from "@/lib/proof";

const ICON: Record<ProofEventType, typeof Banknote> = { commission_paid: Banknote, new_client: Sparkles, testimonial_published: MessageSquareQuote };

export const monthLabel = (month: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}T00:00:00Z`));

export function eventLabel(t: Dictionary, e: PublicProofEvent) {
  const L = t.pf.events.labels as Record<string, string>;
  return L[e.label] ?? e.label;
}

/**
 * "Dynamic proof": real events only — published by staff from a real source
 * (src/app/[locale]/admin/proof). Nothing is generated to fake activity: with
 * no event, nothing renders.
 */
export function ProofFeed({ t, locale, events, types, className }: {
  t: Dictionary; locale: Locale; events: PublicProofEvent[]; types?: ProofEventType[]; className?: string;
}) {
  const list = types ? events.filter((e) => types.includes(e.type)) : events;
  if (!list.length) return null;
  const E = t.pf.events;
  return (
    <div className={className}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{E.title}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => {
          const Icon = ICON[e.type];
          return (
            <li key={e.id} className="proof-reveal flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><Icon className="size-4" aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">
                  {E[e.type]}
                  {e.valueCents != null && e.currency && <> · <span className="tabular">{formatMoney(e.valueCents, locale, e.currency)}</span></>}
                </p>
                <p className="truncate text-[12px] text-muted">{eventLabel(t, e)} · {monthLabel(e.month, locale)}</p>
              </div>
              <BadgeCheck className="size-4 shrink-0 text-success" aria-label={t.pf.badge.verifiedPayment} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
