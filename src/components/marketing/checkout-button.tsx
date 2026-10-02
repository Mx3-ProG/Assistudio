"use client";
import { useFormStatus } from "react-dom";
import { startCheckout } from "@/app/actions/checkout";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} aria-busy={pending}
      className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-accent text-[15px] font-medium text-accent-fg shadow-[0_8px_24px_-8px_var(--accent)] transition hover:brightness-110 disabled:opacity-70">
      {pending ? pendingLabel : label}
    </button>
  );
}

/** Posts to the server action; double submits are harmless (one Checkout Session per click, nothing charged until Stripe). */
export function CheckoutButton({ locale, page, promo, origin, offer, billing = "annual", billingChoices, label, pendingLabel }: {
  locale: string; page: string | null; promo?: string | null; origin: string; offer: string; billing?: "annual" | "monthly";
  billingChoices?: { label: string; monthly: string; annual: string };
  label: string; pendingLabel: string;
}) {
  return (
    <form action={startCheckout}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="origin" value={origin} />
      <input type="hidden" name="offer" value={offer} />
      {billingChoices && offer !== "one" ? <label className="mt-5 block text-start text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
        {billingChoices.label}
        <select name="billing" defaultValue={billing} className="mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[14px] font-medium text-fg outline-none focus:border-accent">
          <option value="monthly">{billingChoices.monthly}</option>
          <option value="annual">{billingChoices.annual}</option>
        </select>
      </label> : <input type="hidden" name="billing" value={billing} />}
      {page && <input type="hidden" name="page" value={page} />}
      {promo && <input type="hidden" name="promo" value={promo} />}
      <Submit label={label} pendingLabel={pendingLabel} />
    </form>
  );
}
