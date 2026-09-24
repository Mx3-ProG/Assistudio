"use client";
import { useI18n } from "@/components/providers";
import { cn } from "@/lib/cn";

export interface FilterState { target: string; channel: string; stage: string }

/** Horizontal, thumb-friendly filter chips (select on narrow screens). */
export function Filters({ value, onChange, targets, channels, stages }: {
  value: FilterState; onChange: (v: FilterState) => void;
  targets: { slug: string; name: string }[]; channels?: string[]; stages?: string[];
}) {
  const { t } = useI18n();
  const sel = "h-10 min-w-0 flex-1 appearance-none rounded-full border border-line bg-surface px-4 text-[13.5px] outline-none focus:border-accent";
  const ch = t.sc.channels as Record<string, string>;
  const st = t.sc.stages as Record<string, string>;
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t.sc.filters}>
      <select aria-label={t.sc.kinds.target} className={cn(sel, "basis-40")} value={value.target} onChange={(e) => onChange({ ...value, target: e.target.value })}>
        <option value="">{t.sc.allTargets}</option>
        {targets.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
      </select>
      {channels && (
        <select aria-label={t.sc.messages.sendWhatsapp} className={cn(sel, "basis-36")} value={value.channel} onChange={(e) => onChange({ ...value, channel: e.target.value })}>
          <option value="">{t.sc.allChannels}</option>
          {channels.map((c) => <option key={c} value={c}>{ch[c] ?? c}</option>)}
        </select>
      )}
      {stages && (
        <select aria-label={t.sc.allStages} className={cn(sel, "basis-36")} value={value.stage} onChange={(e) => onChange({ ...value, stage: e.target.value })}>
          <option value="">{t.sc.allStages}</option>
          {stages.map((s) => <option key={s} value={s}>{st[s] ?? s}</option>)}
        </select>
      )}
    </div>
  );
}
