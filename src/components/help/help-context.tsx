"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useHelpState, DONE_AT, type HelpState } from "@/lib/help/state";
import { TOUR_STEPS } from "@/lib/help/tour";
import { TourOverlay } from "./tour-overlay";
import { HelpCenter } from "./help-center";
import { ResumeTourPrompt } from "./resume-tour-prompt";

interface HelpApi {
  state: HelpState;
  update: (fn: (s: HelpState) => HelpState) => void;
  startTour: (step?: number) => void;
  quitTour: () => void;
  finishTour: () => void;
  goToStep: (step: number) => void;
  centerOpen: boolean;
  openCenter: () => void;
  closeCenter: () => void;
  /** Saves video progress (0..1) and position; ≥ 90 % marks it done. */
  saveVideo: (slug: string, progress: number, at?: number) => void;
  markDone: (slug: string) => void;
  /** Unread replies to the partner's help requests. */
  helpUnread: number;
}

const Ctx = createContext<HelpApi | null>(null);

export function useHelp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHelp outside <HelpProvider>");
  return v;
}

/** Optional variant for components that may render outside the dashboard. */
export function useHelpOptional() {
  return useContext(Ctx);
}

/**
 * Help & onboarding for the partner space: guided tour, help centre, resume
 * prompt and progress memory. Mounted once in the dashboard shell, so the tour
 * survives page changes.
 */
export function HelpProvider({ userId, helpUnread, children }: { userId: string; helpUnread: number; children: React.ReactNode }) {
  const [state, update] = useHelpState(userId);
  const [centerOpen, setCenterOpen] = useState(false);
  const pathname = usePathname();

  // Left in the middle of the tour (reload, closed tab…): never restart it by surprise — offer to resume.
  useEffect(() => {
    update((s) => (s.tour.status === "active" ? { ...s, tour: { ...s.tour, status: "paused", prompt: s.tour.step > 0 } } : s));
  }, [update]);

  // The help centre is a quick lookup: it closes when the partner goes somewhere.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (centerOpen) setCenterOpen(false);
  }

  const startTour = useCallback((step = 0) => {
    setCenterOpen(false);
    update((s) => ({
      ...s, tourOffer: "later",
      tour: { ...s.tour, status: "active", step, prompt: false, startedAt: s.tour.startedAt ?? new Date().toISOString() },
    }));
  }, [update]);
  const quitTour = useCallback(() => update((s) => ({ ...s, tour: { ...s.tour, status: "paused", prompt: false } })), [update]);
  const finishTour = useCallback(() => update((s) => ({
    ...s, tour: { ...s.tour, status: "done", step: TOUR_STEPS.length - 1, prompt: false, completedAt: new Date().toISOString() },
  })), [update]);
  const goToStep = useCallback((step: number) => update((s) => ({ ...s, tour: { ...s.tour, step } })), [update]);
  const saveVideo = useCallback((slug: string, progress: number, at?: number) => update((s) => {
    const prev = s.videos[slug];
    const p = Math.max(0, Math.min(1, progress));
    return { ...s, videos: { ...s.videos, [slug]: { progress: Math.max(prev?.progress ?? 0, p), at, done: (prev?.done ?? false) || p >= DONE_AT } } };
  }), [update]);
  const markDone = useCallback((slug: string) => update((s) => ({
    ...s, videos: { ...s.videos, [slug]: { ...s.videos[slug], progress: Math.max(s.videos[slug]?.progress ?? 0, 1), done: true } },
  })), [update]);

  const api = useMemo<HelpApi>(() => ({
    state, update, startTour, quitTour, finishTour, goToStep,
    centerOpen, openCenter: () => setCenterOpen(true), closeCenter: () => setCenterOpen(false),
    saveVideo, markDone, helpUnread,
  }), [state, update, startTour, quitTour, finishTour, goToStep, centerOpen, saveVideo, markDone, helpUnread]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <HelpCenter />
      {state.tour.status === "active" && <TourOverlay />}
      {state.tour.status === "paused" && state.tour.prompt && <ResumeTourPrompt />}
    </Ctx.Provider>
  );
}
