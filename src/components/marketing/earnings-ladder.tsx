"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/providers";
import { illustrate } from "@/lib/commission";
import { formatMoney } from "@/lib/money";
import { convertCurrency } from "@/i18n/currency";
import { fmt } from "@/i18n/format";

const STEPS = [1, 5, 10, 50];

/** Purely mathematical illustration: clients × price × rate. Not a promise. */
export function EarningsLadder({ priceCents, rate }: { priceCents: number; rate: number }) {
  const { t, locale, currency } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown(true), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const max = illustrate(STEPS[STEPS.length - 1], priceCents, rate);
  return (
    <div ref={ref} className="grid grid-cols-4 items-end gap-2 sm:gap-4">
      {STEPS.map((n, i) => {
        const cents = illustrate(n, priceCents, rate);
        // log scale keeps small steps visible
        const h = 18 + (Math.log10(cents) / Math.log10(max)) * 82;
        return (
          <div key={n} className="flex flex-col items-center gap-3">
            <div className="tabular text-center text-[13px] font-semibold sm:text-[17px]">
              {formatMoney(convertCurrency(cents, "EUR", currency), locale, currency)}
              <span className="block text-[11px] font-normal text-muted sm:inline sm:text-[12px]"> {t.home.ladderPerYear}</span>
            </div>
            <div className="relative flex h-40 w-full items-end sm:h-56">
              <div
                className="w-full rounded-2xl bg-gradient-to-t from-accent to-accent-2 shadow-[0_20px_40px_-20px_var(--accent)] transition-[height] ease-[cubic-bezier(.2,.8,.2,1)]"
                style={{ height: shown ? `${h}%` : "4%", transitionDuration: `${900 + i * 180}ms`, opacity: 0.55 + i * 0.15 }}
              />
            </div>
            <div className="text-[12px] text-muted sm:text-[13px]">
              {n === 1 ? t.home.ladderClient : fmt(t.home.ladderClients, { n })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
