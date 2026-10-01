"use client";
import { useI18n } from "@/components/providers";
import { convertCurrency } from "@/i18n/currency";
import { formatMoney } from "@/lib/money";

export function Money({ cents, sourceCurrency = "EUR", compact = false, className }: {
  cents: number;
  sourceCurrency?: string;
  compact?: boolean;
  className?: string;
}) {
  const { locale, currency } = useI18n();
  return <span className={className}>{formatMoney(convertCurrency(cents, sourceCurrency, currency), locale, currency, { compact })}</span>;
}
