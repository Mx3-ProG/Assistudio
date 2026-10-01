"use client";
import { createContext, useContext } from "react";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { isCurrency, type Currency } from "@/i18n/currency";
import { useStored } from "@/lib/hooks/use-stored";

const I18nContext = createContext<{
  locale: Locale;
  t: Dictionary;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
} | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: React.ReactNode }) {
  const [storedCurrency, setStoredCurrency] = useStored("studio-currency", "EUR");
  const currency = isCurrency(storedCurrency) ? storedCurrency : "EUR";

  function setCurrency(next: Currency) {
    setStoredCurrency(next);
    document.cookie = `STUDIO_CURRENCY=${next};path=/;max-age=31536000;samesite=lax`;
  }

  return <I18nContext.Provider value={{ locale, t: dict, currency, setCurrency }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
