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
export function CheckoutButton({ locale, page, promo, origin, offer, label, pendingLabel }: {
  locale: string; page: string | null; promo?: string | null; origin: string; offer: string; label: string; pendingLabel: string;
}) {
  return (
    <form action={startCheckout}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="origin" value={origin} />
      <input type="hidden" name="offer" value={offer} />
      {page && <input type="hidden" name="page" value={page} />}
      {promo && <input type="hidden" name="promo" value={promo} />}
      <Submit label={label} pendingLabel={pendingLabel} />
    </form>
  );
}
