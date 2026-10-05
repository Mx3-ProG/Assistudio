"use client";
import { Compass, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { fmt } from "@/i18n/format";
import { buttonClass } from "@/components/ui/button";
import { useHelp } from "./help-context";

/**
 * "Continue your tour?" — a small, non-blocking card shown once after the
 * partner left in the middle of the tour. "Later" silences it for good; the
 * help centre keeps offering to resume.
 */
export function ResumeTourPrompt() {
  const { t } = useI18n();
  const T = t.hp.tour;
  const { state, startTour, update } = useHelp();
  const later = () => update((s) => ({ ...s, tour: { ...s.tour, prompt: false } }));
  return (
    <div role="status" className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[60] rounded-[22px] border border-line bg-bg-elevated p-4 shadow-lift sm:inset-x-auto sm:end-6 sm:w-[360px] lg:bottom-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Compass className="size-[18px]" /></span>
        <p className="flex-1 pt-1.5 text-[15px] font-semibold">{T.resumeTitle}</p>
        <button type="button" onClick={later} aria-label={T.later} className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2"><X className="size-4" /></button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => startTour(state.tour.step)} className={buttonClass("accent", "sm")}>{fmt(T.resume, { n: state.tour.step + 1 })}</button>
        <button type="button" onClick={() => startTour(0)} className={buttonClass("secondary", "sm")}>{T.restart}</button>
        <button type="button" onClick={later} className={buttonClass("ghost", "sm", "text-muted")}>{T.later}</button>
      </div>
    </div>
  );
}
