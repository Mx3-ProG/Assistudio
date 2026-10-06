"use client";
import { useEffect, useRef, useState } from "react";
import { Share2, UserRoundCheck, ShoppingBag, Sparkles, Wallet, HandCoins, BadgeCheck } from "lucide-react";
import { useI18n } from "@/components/providers";
import { formatMoney } from "@/lib/money";
import type { FlowStep } from "@/lib/proof";
import { cn } from "@/lib/cn";

const ICONS: Record<FlowStep["key"], typeof Share2> = {
  shared: Share2, followed: UserRoundCheck, sold: ShoppingBag, generated: Sparkles, available: Wallet, requested: HandCoins, paid: BadgeCheck,
};

/**
 * Contact shared → … → payout made. A timeline (vertical on phones, horizontal
 * from `lg`) that lights up step by step once visible. Amounts are those of a
 * labelled simulation; with reduced motion every step is shown at once.
 */
export function MoneyFlow({ steps, currency }: { steps: FlowStep[]; currency: string }) {
  const { t, locale } = useI18n();
  const S = t.pf.amb.steps;
  const ref = useRef<HTMLOListElement>(null);
  // Fully shown by default (server render, no JS, reduced motion); the step-by-step
  // animation only plays for a timeline that scrolls into view later.
  const [lit, setLit] = useState(steps.length);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    let armed = false;
    const io = new IntersectionObserver(([e]) => {
      if (!armed) {
        armed = true;
        if (e.isIntersecting) { io.disconnect(); return; }
        setLit(0);
        return;
      }
      if (!e.isIntersecting) return;
      io.disconnect();
      timer = setInterval(() => setLit((n) => {
        if (n + 1 >= steps.length && timer) clearInterval(timer);
        return Math.min(n + 1, steps.length);
      }), 260);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { io.disconnect(); if (timer) clearInterval(timer); };
  }, [steps.length]);

  return (
    <ol ref={ref} className="relative grid gap-0 lg:grid-cols-7 lg:gap-3">
      {steps.map((step, i) => {
        const Icon = ICONS[step.key];
        const on = i < lit;
        const last = i === steps.length - 1;
        return (
          <li key={step.key} className="relative flex gap-4 pb-6 lg:flex-col lg:gap-3 lg:pb-0">
            {/* connector: vertical on phones, horizontal on desktop */}
            {!last && (
              <span aria-hidden className="absolute start-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 overflow-hidden rounded-full bg-line lg:start-10 lg:top-[19px] lg:h-0.5 lg:w-[calc(100%-1.75rem)]">
                <span className={cn("block size-full origin-top bg-accent transition-transform duration-500 lg:origin-left rtl:lg:origin-right", i + 1 < lit ? "scale-100" : "scale-0")} />
              </span>
            )}
            <span className={cn("relative z-10 grid size-10 shrink-0 place-items-center rounded-full border transition-all duration-500",
              on ? (last ? "border-success bg-success text-white shadow-[0_8px_24px_-8px_var(--success)]" : "border-accent bg-accent text-accent-fg shadow-[0_8px_24px_-10px_var(--accent)]") : "border-line bg-surface text-muted")}>
              <Icon className="size-4" aria-hidden />
            </span>
            <div className={cn("min-w-0 transition-opacity duration-500 lg:pe-1", on ? "opacity-100" : "opacity-55")}>
              <p className="tabular text-[11px] font-semibold text-muted">0{i + 1}</p>
              <p className="text-[15px] font-semibold leading-snug">{S[step.key].title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{S[step.key].body}</p>
              {step.amountCents != null && (
                <p className="tabular mt-2 inline-flex rounded-full bg-surface-2 px-2.5 py-0.5 text-[13px] font-semibold">
                  {formatMoney(step.amountCents, locale, currency)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
