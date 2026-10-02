"use client";
import { useI18n } from "@/components/providers";
import { convertCurrency, type Currency } from "@/i18n/currency";
import { formatMoney } from "@/lib/money";

export function Money({ cents, sourceCurrency = "EUR", displayCurrency, compact = false, className }: {
  cents: number;
  sourceCurrency?: string;
  displayCurrency?: Currency;
  compact?: boolean;
  className?: string;
}) {
  const { locale, currency } = useI18n();
  const target = displayCurrency ?? currency;
  return <span className={className}>{formatMoney(convertCurrency(cents, sourceCurrency, target), locale, target, { compact })}</span>;
}
