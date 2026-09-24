"use client";
import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { useI18n } from "@/components/providers";
import { nextBestAction, type Rules, type ProspectLike } from "@/lib/sales/next-action";
import { fmt } from "@/i18n/format";
import { formatDate } from "@/lib/money";
import { cn } from "@/lib/cn";

/** Explainable suggestion for one prospect. Never sends anything by itself. */
export function NextAction({ prospect, rules, targetSlug, now, compact = false }: {
  prospect: ProspectLike; rules: Rules; targetSlug?: string | null; now: number; compact?: boolean;
}) {
  const { t, locale } = useI18n();
  const a = nextBestAction(prospect, now, rules);
  if (!a) return null;
  const C = t.sc.crm;
  const reason = fmt(C.reasons[a.kind], { days: a.days, date: a.dueAt ? formatDate(a.dueAt, locale, "short") : "" });
  const qs = new URLSearchParams();
  if (a.resource?.stage) qs.set("stage", a.resource.stage);
  if (targetSlug) qs.set("target", targetSlug);
  const href = a.resource ? `/${locale}/dashboard/sales-center/${a.resource.section}${qs.size ? `?${qs}` : ""}` : null;

  if (compact) {
    return (
      <p className={cn("mt-2 flex items-center gap-1.5 text-[12px]", a.urgent ? "text-accent" : "text-muted")} title={reason}>
        <Lightbulb className="size-3 shrink-0" />
        <span className="truncate">{C.kinds[a.kind]}</span>
      </p>
    );
  }
  return (
    <div className={cn("rounded-2xl border p-4", a.urgent ? "border-accent/40 bg-accent-soft" : "border-line bg-surface-2")}>
      <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-muted"><Lightbulb className="size-3.5 text-accent" />{C.nextBest}</p>
      <p className="mt-1.5 text-[15px] font-semibold">{C.kinds[a.kind]}</p>
      <p className="mt-0.5 text-[13px] text-fg-2"><span className="text-muted">{C.why} · </span>{reason}</p>
      {href && (
        <Link href={href} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline">
          {C.open} <ArrowRight className="flip-rtl size-3.5" />
        </Link>
      )}
    </div>
  );
}
