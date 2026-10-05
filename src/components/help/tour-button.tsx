"use client";
import { Compass } from "lucide-react";
import { useI18n } from "@/components/providers";
import { buttonClass } from "@/components/ui/button";
import { useHelp } from "./help-context";

/** Discreet "Guided tour" button for the dashboard header — always available, never pushed. */
export function TourButton() {
  const { t } = useI18n();
  const { startTour, state } = useHelp();
  const resume = state.tour.status === "paused" && state.tour.step > 0;
  return (
    <button type="button" onClick={() => startTour(resume ? state.tour.step : 0)} className={buttonClass("ghost", "sm", "text-fg-2")}>
      <Compass className="size-4" />{t.hp.center.tour}
    </button>
  );
}
