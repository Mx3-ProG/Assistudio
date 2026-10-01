"use client";
import { Coins } from "lucide-react";
import { useI18n } from "@/components/providers";
import { currencies, currencyMeta, type Currency } from "@/i18n/currency";
import { cn } from "@/lib/cn";

export function CurrencySwitcher({ className, responsiveCompact = false }: { className?: string; responsiveCompact?: boolean }) {
  const { t, currency, setCurrency } = useI18n();

  return (
    <label
      title={t.common.currencyNote}
      className={cn(
        "relative inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface-2 ps-2.5 pe-2 text-[13px] text-fg-2",
        responsiveCompact && "max-sm:size-8 max-sm:justify-center max-sm:p-0",
        className,
      )}
    >
      <Coins className="size-3.5 shrink-0 text-muted" aria-hidden />
      <span className="sr-only">{t.common.currency}</span>
      <select
        value={currency}
        aria-label={t.common.currency}
        onChange={(event) => setCurrency(event.target.value as Currency)}
        className={cn(
          "appearance-none bg-transparent pe-1 font-medium outline-none",
          responsiveCompact && "max-sm:absolute max-sm:inset-0 max-sm:cursor-pointer max-sm:opacity-0",
        )}
      >
        {currencies.map((code) => <option key={code} value={code}>{code} · {currencyMeta[code].label}</option>)}
      </select>
    </label>
  );
}
