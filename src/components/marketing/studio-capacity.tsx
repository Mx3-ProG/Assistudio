import type { Dictionary } from "@/i18n/types";
import { fmt } from "@/i18n/format";
import type { Settings } from "@/lib/data/types";
import { studioCapacityState } from "@/lib/studio-capacity";

export function StudioCapacitySignal({ t, settings, className = "", dark = false, compact = false }: {
  t: Dictionary;
  settings: Settings;
  className?: string;
  dark?: boolean;
  compact?: boolean;
}) {
  const state = studioCapacityState(settings);
  if (state.status === "hidden") return null;
  const full = state.status === "full";
  const copy = full
    ? fmt(t.studio.capacityFull, { window: state.window || "—" })
    : fmt(t.studio.capacityAvailable, {
      remaining: state.remaining,
      total: state.total,
    });

  return <div className={`flex items-start gap-3 rounded-2xl border ${compact ? "p-3" : "p-4"} ${dark ? "border-white/15 bg-white/10 text-white" : "border-line bg-surface/80"} ${className}`}>
    <span className={`mt-1 size-2.5 shrink-0 rounded-full ${full ? "bg-warning" : "bg-success animate-pulse-dot"}`} />
    <div>
      <p className={`${compact ? "text-[12px]" : "text-[13px]"} font-semibold leading-relaxed`}>{copy}</p>
      {state.window && !full && !compact && <p className={`mt-1 text-[12px] ${dark ? "text-white/55" : "text-muted"}`}>{fmt(t.studio.capacityNext, { window: state.window })}</p>}
    </div>
  </div>;
}
