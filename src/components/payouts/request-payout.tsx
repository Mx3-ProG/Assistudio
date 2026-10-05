"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Landmark, Loader2, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { fmt } from "@/i18n/format";
import { formatMoney } from "@/lib/money";
import { requestPayoutAction, type PayoutActionState } from "@/app/actions/payouts";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/**
 * [Demander mon paiement] + the request dialog. The dialog only collects a
 * wish: the server recomputes the balance and every rule. One idempotency key
 * per opening and a locked button while sending: a double click can never
 * create two requests.
 */
export function RequestPayout({ availableCents, minimumCents, disabled, methodLabel, methodHint }: {
  availableCents: number;
  minimumCents: number;
  /** The caller explains why (below minimum, request in progress, not validated). */
  disabled: boolean;
  methodLabel: string;
  methodHint: string | null;
}) {
  const { t } = useI18n();
  const [key, setKey] = useState<string | null>(null);
  return (
    <>
      <button type="button" onClick={() => setKey(crypto.randomUUID())} disabled={disabled} aria-haspopup="dialog"
        className={buttonClass("accent", "lg", "w-full sm:w-auto disabled:opacity-40")}>
        {t.po.hero.cta}<ArrowRight className="flip-rtl size-4" />
      </button>
      {key && (
        <RequestDialog key={key} idemKey={key} onClose={() => setKey(null)} availableCents={availableCents}
          minimumCents={minimumCents} methodLabel={methodLabel} methodHint={methodHint} />
      )}
    </>
  );
}

function RequestDialog({ idemKey, onClose, availableCents, minimumCents, methodLabel, methodHint }: {
  idemKey: string; onClose: () => void; availableCents: number; minimumCents: number; methodLabel: string; methodHint: string | null;
}) {
  const { t, locale } = useI18n();
  const P = t.po;
  const money = (c: number) => formatMoney(c, locale, "EUR");
  const decimal = locale === "en" || locale === "hi" ? "." : ",";
  const [amount, setAmount] = useState(() => (availableCents / 100).toFixed(2).replace(".", decimal));
  const [state, action, pending] = useActionState<PayoutActionState, FormData>(requestPayoutAction, {});
  const input = useRef<HTMLInputElement>(null);
  const close = () => { if (!pending) onClose(); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    if (window.matchMedia("(min-width: 640px)").matches) input.current?.select();
    return () => window.removeEventListener("keydown", onKey);
  });

  // Client-side hint only: the server decides.
  const cents = Math.round(Number(amount.replace(/[\s  €]/g, "").replace(",", ".")) * 100);
  const valid = Number.isFinite(cents) && cents >= minimumCents && cents <= availableCents;
  const success = state.ok === true ? state : null;
  const error = state.ok !== true ? state.error : undefined;
  const errorText = error
    ? error === "generic" ? P.modal.errorGeneric : fmt(P.errors[error] ?? P.modal.errorGeneric, { min: money(minimumCents) })
    : null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="payout-dialog-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={close} />
      <div className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[28px] bg-bg-elevated p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-lift sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:border sm:border-line sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 id="payout-dialog-title" className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">{P.modal.title}</h2>
          <button type="button" onClick={close} disabled={pending} aria-label={P.modal.close} className="grid size-9 place-items-center rounded-full bg-surface-2"><X className="size-4" /></button>
        </div>

        {success ? (
          <div className="py-6 text-center" role="status">
            <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
            <p className="mt-4 text-[22px] font-semibold tracking-tight">{P.modal.successTitle}</p>
            <p className="mt-2 text-[15px] text-fg-2">{fmt(P.modal.successBody, { amount: money(success.amountCents) })}</p>
            <p className="tabular mt-1 text-[13px] text-muted">{fmt(P.modal.successRef, { ref: success.ref })}</p>
            <p className="mt-4 text-[13px] text-muted">{P.modal.successNext}</p>
            <button type="button" onClick={onClose} className={buttonClass("primary", "md", "mt-6 w-full")}>{P.modal.close}</button>
          </div>
        ) : (
          <form action={action} className="mt-5">
            <input type="hidden" name="key" value={idemKey} />
            <p className="text-[13px] text-muted">{P.modal.available}</p>
            <p className="tabular text-[30px] font-semibold tracking-[-0.03em]">{money(availableCents)}</p>

            <label htmlFor="payout-amount" className="mt-5 block text-[13px] font-medium">{P.modal.amount}</label>
            <div className="mt-1.5 flex gap-2">
              <input ref={input} id="payout-amount" name="amount" inputMode="decimal" autoComplete="off" required value={amount}
                onChange={(e) => setAmount(e.target.value)} aria-describedby="payout-amount-hint" aria-invalid={!valid}
                className={cn(inputClass, "tabular h-12 flex-1 text-[18px] font-semibold")} />
              <button type="button" onClick={() => setAmount((availableCents / 100).toFixed(2).replace(".", decimal))} className={buttonClass("secondary", "lg", "px-4")}>{P.modal.all}</button>
            </div>
            <p id="payout-amount-hint" className="mt-1.5 text-[12.5px] text-muted">{fmt(P.modal.min, { amount: money(minimumCents) })}</p>

            <div className="mt-5 flex gap-3 rounded-2xl bg-surface-2 p-4">
              <Landmark className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{P.modal.method}</p>
                <p className="mt-0.5 text-[14.5px] font-medium">{methodLabel}</p>
                {methodHint && <p className="mt-1 text-[12.5px] leading-snug text-muted">{methodHint}</p>}
              </div>
            </div>

            {errorText && <p role="alert" className="mt-4 rounded-2xl bg-danger-soft p-3 text-[13.5px] text-danger">{errorText}</p>}

            <button type="submit" disabled={pending || !valid} className={buttonClass("accent", "lg", "mt-5 w-full disabled:opacity-40")}>
              {pending ? <><Loader2 className="size-4 animate-spin" />{P.modal.sending}</> : fmt(P.modal.submit, { amount: valid ? money(cents) : "" })}
            </button>
            <button type="button" onClick={close} disabled={pending} className={buttonClass("ghost", "md", "mt-2 w-full text-muted")}>{P.modal.cancel}</button>
          </form>
        )}
      </div>
    </div>
  );
}
