"use client";
import { useActionState, useState } from "react";
import { createPromoCode, type FormState } from "@/app/actions/dashboard";
import { useI18n } from "@/components/providers";
import { Field, inputClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { fmt } from "@/i18n/format";
import { formatPercent } from "@/lib/money";

export function PromoCodeForm({ commissionRate, approved }: { commissionRate: number; approved: boolean }) {
  const { t, locale } = useI18n();
  const P = t.dash.promoCodes;
  const [discount, setDiscount] = useState(10);
  const [state, action, pending] = useActionState<FormState, FormData>(createPromoCode, {});
  const error = state.error === "taken" ? P.taken : state.error === "not_approved" ? P.notApproved : state.error ? P.invalid : null;
  return (
    <form action={action} className="card grid gap-4 p-5 sm:grid-cols-[1fr_180px_auto] sm:items-end sm:p-6">
      <Field label={P.code} hint={P.codeHint}>
        <input name="code" required minLength={3} maxLength={24} pattern="[A-Za-z0-9][A-Za-z0-9-]{2,23}"
          placeholder="CLIENT10" className={`${inputClass} font-mono uppercase`} autoCapitalize="characters" />
      </Field>
      <Field label={P.discount} hint={fmt(P.margin, { rate: formatPercent(Math.max(0, commissionRate - discount / 100), locale, 0) })}>
        <div className="relative"><input name="discount" type="number" min={0} max={20} step={1} value={discount}
          onChange={(e) => setDiscount(Math.min(20, Math.max(0, Number(e.target.value))))} className={`${inputClass} pe-9 tabular`} />
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-muted">%</span></div>
      </Field>
      <button disabled={pending || !approved} className={buttonClass("accent", "md", "h-11")}>{P.create}</button>
      {(error || state.ok) && <p className={`text-[13px] sm:col-span-3 ${error ? "text-danger" : "text-success"}`}>{error ?? t.dash.settings.saved}</p>}
    </form>
  );
}
