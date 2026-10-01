export const currencies = ["EUR", "USD", "GBP", "CHF", "CAD"] as const;
export type Currency = (typeof currencies)[number];

export const currencyMeta: Record<Currency, { label: string; symbol: string }> = {
  EUR: { label: "Euro", symbol: "€" },
  USD: { label: "US Dollar", symbol: "$" },
  GBP: { label: "British Pound", symbol: "£" },
  CHF: { label: "Swiss Franc", symbol: "CHF" },
  CAD: { label: "Canadian Dollar", symbol: "CA$" },
};

/**
 * Indicative display rates, expressed as the value of one EUR. Stripe remains
 * the source of truth for the amount and currency actually charged.
 */
const EUR_RATES: Record<Currency, number> = {
  EUR: 1,
  USD: 1.17,
  GBP: 0.87,
  CHF: 0.93,
  CAD: 1.61,
};

export function isCurrency(value: string | null | undefined): value is Currency {
  return !!value && (currencies as readonly string[]).includes(value);
}

export function convertCurrency(cents: number, from: string, to: Currency) {
  const source = isCurrency(from.toUpperCase()) ? from.toUpperCase() as Currency : "EUR";
  if (source === to) return cents;
  const euros = cents / EUR_RATES[source];
  return Math.round(euros * EUR_RATES[to]);
}
