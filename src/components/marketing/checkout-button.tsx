"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

/** Keeps the visitor on Studio ATS. The destination page creates the Stripe
 * Session with a Server Action and mounts Embedded Checkout in our layout. */
export function CheckoutButton({ locale, page, promo, origin, offer, billing = "annual", billingChoices, label }: {
  locale: string; page: string | null; promo?: string | null; origin: string; offer: string; billing?: "annual" | "monthly";
  billingChoices?: { label: string; monthly: string; annual: string };
  label: string; pendingLabel: string;
}) {
  const [selectedBilling, setSelectedBilling] = useState(billing);
  const href = useMemo(() => {
    const query = new URLSearchParams({
      offer,
      billing: offer === "one" ? "annual" : selectedBilling,
      origin: page ? "private_page" : origin === "dashboard_cta" ? "dashboard_cta" : origin === "affiliate_link" ? "affiliate_link" : "public",
    });
    if (page) query.set("page", page);
    if (promo) query.set("promo", promo);
    return `/${locale}/checkout?${query.toString()}`;
  }, [locale, offer, origin, page, promo, selectedBilling]);

  return (
    <div>
      {billingChoices && offer !== "one" ? <label className="mt-5 block text-start text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
        {billingChoices.label}
        <select value={selectedBilling} onChange={(event) => setSelectedBilling(event.target.value as "annual" | "monthly")}
          className="mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[14px] font-medium text-fg outline-none focus:border-accent">
          <option value="monthly">{billingChoices.monthly}</option>
          <option value="annual">{billingChoices.annual}</option>
        </select>
      </label> : null}
      <Link href={href}
        className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-accent text-[15px] font-medium text-accent-fg shadow-[0_8px_24px_-8px_var(--accent)] transition hover:brightness-110">
        {label}
      </Link>
    </div>
  );
}
