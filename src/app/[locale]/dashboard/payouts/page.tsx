import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Banknote, CreditCard, Hourglass, ShieldCheck } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/money";
import { isOpenPayout, moneyMovements } from "@/lib/payouts";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { payoutTone } from "@/components/dashboard/status";
import { RequestPayout } from "@/components/payouts/request-payout";
import { cn } from "@/lib/cn";

/**
 * "How do I get my money?" — the available amount first, then one button.
 *   sale → commission in validation → available → request → processing → paid
 * Pending money is never shown as earned; requested money is no longer
 * available. Bank details live at Stripe (Connect), never in Studio ATS.
 */
export default async function Payouts({ params }: PageProps<"/[locale]/dashboard/payouts">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const [b, payouts, settings, connect, commissions] = await Promise.all([
    repo().getBalances(s), repo().listPayouts(s), repo().getSettings(), repo().getConnectStatus(s), repo().listCommissions(s),
  ]);
  const P = t.po;
  const money = (c: number) => formatMoney(c, locale, "EUR");
  const open = payouts.find((p) => isOpenPayout(p.status)) ?? null;
  const approved = s.affiliate.status === "approved";
  const min = settings.payoutMinimumCents;
  const available = b.availableCents;

  // Why the button is disabled — always said in plain words.
  const blockedReason = !approved ? P.hero.notApproved
    : open ? fmt(P.hero.open, { ref: open.ref })
    : available <= 0 ? P.hero.none
    : available < min ? fmt(P.hero.belowMin, { amount: money(min) })
    : null;

  const stripe = connect.accountConnected && connect.payoutsEnabled;
  const methodLabel = stripe ? (connect.payoutLast4 ? fmt(P.method.account, { last4: connect.payoutLast4 }) : P.modal.methodStripe) : P.modal.methodManual;
  const methodHint = stripe ? null : P.modal.methodManualHint;

  const tiles = [
    { label: P.tiles.onHold, hint: P.tiles.onHoldHint, value: b.awaitingPaymentCents + b.disputedCents, tone: "text-muted", dashed: true },
    { label: P.tiles.validating, hint: P.tiles.validatingHint, value: b.pendingCents, tone: "text-warning", dashed: true },
    { label: P.tiles.available, value: Math.max(available, 0), tone: "text-accent" },
    { label: P.tiles.requested, value: b.requestedCents, tone: "text-fg" },
    { label: P.tiles.paid, value: b.paidCents, tone: "text-success" },
  ];

  const movements = moneyMovements(
    commissions.map((c) => ({ status: c.status, amountCents: c.amountCents, availableAt: c.holdUntil, validatedAt: c.validatedAt, saleRef: c.saleRef, kind: c.kind === "renewal" ? "renewal" as const : "new" as const })),
    payouts.map((p) => ({ ref: p.ref, amountCents: p.amountCents, status: p.status, requestedAt: p.requestedAt, paidAt: p.paidAt })),
  ).slice(0, 30);

  const step = open ? (open.status === "processing" ? 4 : 3) : -1;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] sm:text-[34px]">{t.dash.payouts.title}</h1>
        <p className="mt-1 text-[15px] text-muted">{t.dash.payouts.subtitle}</p>
      </header>

      {/* 1. The amount, then the one button. */}
      <section className="card relative overflow-hidden border-accent/30 p-6 sm:p-8" aria-labelledby="available-title">
        <div className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full bg-accent/15 blur-3xl" />
        <p className="relative text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{P.hero.eyebrow}</p>
        <h2 id="available-title" className="tabular relative mt-2 text-[40px] font-semibold leading-none tracking-[-0.04em] sm:text-[56px]">
          {fmt(P.hero.available, { amount: money(Math.max(available, 0)) })}
        </h2>
        <p className="relative mt-3 text-[14px] text-muted">{fmt(P.hero.minimum, { amount: money(min) })}</p>
        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <RequestPayout availableCents={Math.max(available, 0)} minimumCents={min} disabled={!!blockedReason} methodLabel={methodLabel} methodHint={methodHint} />
          {blockedReason && <p className="text-[13.5px] text-fg-2">{blockedReason}</p>}
        </div>
        {available < 0 && <p className="relative mt-3 text-[12.5px] text-muted">{t.dash.payouts.pipeline}</p>}
      </section>

      {/* 2. Where every euro is. */}
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5" aria-label={t.dash.payouts.title}>
        {tiles.map((x) => (
          <div key={x.label} className={cn("card p-4", x.dashed && "border-dashed")}>
            <p className={cn("tabular flex items-center gap-1.5 text-[20px] font-semibold leading-none tracking-[-0.03em] sm:text-[22px]", x.tone)}>
              {x.dashed && <Hourglass className="size-3.5 shrink-0" aria-hidden />}{money(x.value)}
            </p>
            <p className="mt-2 text-[13px] text-fg-2">{x.label}</p>
            {x.hint && <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{x.hint}</p>}
          </div>
        ))}
      </section>

      {/* 3. The request in progress, on its path. */}
      {open && (
        <section className="card p-5 sm:p-6" aria-labelledby="open-request">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p id="open-request" className="text-[15px] font-semibold">{P.requests.title} · <span className="tabular">{open.ref}</span></p>
              <p className="text-[13px] text-muted">{formatDate(open.requestedAt, locale)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={payoutTone[open.status]}>{P.statuses[open.status]}</Badge>
              <p className="tabular text-[20px] font-semibold">{money(open.amountCents)}</p>
            </div>
          </div>
          <ol className="mt-5 grid grid-cols-6 gap-1.5" aria-label={P.requests.title}>
            {P.flow.map((label, i) => (
              <li key={label} className="min-w-0">
                <span className={cn("block h-1.5 rounded-full", i <= step ? "bg-accent" : "bg-surface-3")} />
                <span className={cn("mt-1.5 block truncate text-[11px] sm:text-[12px]", i === step ? "font-semibold text-fg" : "text-muted")}>{label}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          {/* 4. Payout method — non-sensitive information only. */}
          <Card className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold"><CreditCard className="size-4 text-accent" />{P.method.title}</h2>
            <div className="mt-4 rounded-2xl bg-surface-2 p-4">
              <p className="text-[14.5px] font-medium">{stripe ? P.method.connected : connect.enabled ? P.method.none : P.modal.methodManual}</p>
              {stripe && connect.payoutLast4 && <p className="tabular mt-0.5 text-[13.5px] text-fg-2">{fmt(P.method.account, { last4: connect.payoutLast4 })}</p>}
              {!stripe && !connect.enabled && <p className="mt-1 text-[12.5px] leading-snug text-muted">{P.method.manual}</p>}
              {connect.enabled && (
                <Link href={`/${locale}/dashboard/payouts/settings`} className={buttonClass("secondary", "md", "mt-3")}>
                  {stripe ? P.method.manage : P.method.configure}
                </Link>
              )}
            </div>
            <p className="mt-3 flex items-center gap-2 text-[12px] text-muted"><ShieldCheck className="size-3.5" />{P.method.hint}</p>
          </Card>

          {/* 5. Requests and their outcome. */}
          <Card className="overflow-hidden">
            <h2 className="px-5 pt-5 text-[15px] font-semibold sm:px-6">{P.requests.title}</h2>
            {payouts.length === 0 ? <EmptyState icon={<Banknote className="size-5" />} title={P.requests.empty} /> : (
              <ul className="mt-3 divide-y divide-line">
                {payouts.map((p) => (
                  <li key={p.id} className="px-5 py-3.5 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="tabular font-medium">{p.ref}</p>
                        <p className="text-[12px] text-muted">{formatDate(p.paidAt ?? p.requestedAt, locale)}</p>
                      </div>
                      <Badge tone={payoutTone[p.status]}>{P.statuses[p.status]}</Badge>
                      <p className="tabular w-24 text-end font-semibold">{money(p.amountCents)}</p>
                    </div>
                    {(p.status === "rejected" || p.status === "failed") && p.rejectionReason && (
                      <p className="mt-1.5 text-[12.5px] text-danger">{fmt(P.requests.reason, { reason: p.rejectionReason })}</p>
                    )}
                    {p.status === "paid" && p.paymentReference && (
                      <p className="mt-1 text-[12px] text-muted">{fmt(P.requests.paidWith, { ref: p.paymentReference })}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* 6. Every movement of money, newest first. */}
        <Card className="overflow-hidden">
          <h2 className="px-5 pt-5 text-[15px] font-semibold sm:px-6">{P.history.title}</h2>
          {movements.length === 0 ? <EmptyState icon={<Banknote className="size-5" />} title={P.history.empty} /> : (
            <ol className="mt-3 divide-y divide-line">
              {movements.map((m, i) => {
                const out = m.kind === "request";
                const label = m.kind === "commission" ? fmt(m.renewal ? P.history.renewal : P.history.commission, { ref: m.saleRef })
                  : m.kind === "request" ? fmt(P.history.request, { ref: m.ref }) : fmt(P.history.payout, { ref: m.ref });
                const status = m.kind === "commission" ? P.history.validated : m.kind === "request" ? P.statuses[m.status] : P.statuses.paid;
                return (
                  <li key={`${m.kind}-${i}`} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", out ? "bg-surface-2 text-fg-2" : m.kind === "payout" ? "bg-success-soft text-success" : "bg-accent-soft text-accent")}>
                      {out ? <ArrowUpRight className="size-4" aria-hidden /> : <ArrowDownLeft className="size-4" aria-hidden />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{label}</p>
                      <p className="text-[12px] text-muted">{formatDate(m.at, locale, "short")} · {status}</p>
                    </div>
                    <p className={cn("tabular shrink-0 text-[14.5px] font-semibold", out ? "text-fg-2" : m.kind === "payout" ? "text-success" : "")}>
                      {out ? "−" : "+"} {money(m.amountCents)}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
