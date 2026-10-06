import Link from "next/link";
import { ArrowRight, MessageSquareQuote } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import type { ReviewMoment } from "@/lib/proof";

/** Shown after a milestone (first sale / commission / payout) to a partner who has not given a review yet. */
export function ReviewPrompt({ t, moment, href }: { t: Dictionary; moment: ReviewMoment; href: string }) {
  const P = t.pf.prompt;
  return (
    <Link href={href} className="card group flex items-center gap-4 border-accent/25 bg-accent-soft/40 p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-fg"><MessageSquareQuote className="size-5" aria-hidden /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-accent">{P.title}</span>
        <span className="mt-1 block text-[15px] font-medium leading-snug">{P[moment]}</span>
      </span>
      <span className="hidden items-center gap-1 text-[13.5px] font-semibold text-accent sm:flex">{P.cta}<ArrowRight className="flip-rtl size-4 transition group-hover:translate-x-0.5" /></span>
    </Link>
  );
}
