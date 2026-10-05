"use client";
import { useCallback, useMemo } from "react";
import { useStored } from "@/lib/hooks/use-stored";

/**
 * Onboarding & help progress, per partner and per browser (localStorage).
 * Pure UI memory — no business data — so it never needs the database: losing
 * it only means the tour is offered again.
 */
export type TourStatus = "idle" | "active" | "paused" | "done";

export interface HelpState {
  v: 1;
  /** onboardingStarted / onboardingCompleted / currentTourStep */
  tour: { status: TourStatus; step: number; startedAt?: string; completedAt?: string; prompt?: boolean };
  /** videosWatched / videoProgress — progress is 0..1 of the video (or segment). */
  videos: Record<string, { progress: number; at?: number; done: boolean }>;
  /** "Nouveau ici ?" block and its tour proposal. */
  intro: "open" | "dismissed";
  tourOffer: "open" | "later";
  /** Micro-onboarding hints already acknowledged. */
  seen: Record<string, true>;
}

const EMPTY: HelpState = { v: 1, tour: { status: "idle", step: 0 }, videos: {}, intro: "open", tourOffer: "open", seen: {} };

function parse(raw: string | null): HelpState {
  if (!raw) return EMPTY;
  try {
    const x = JSON.parse(raw) as Partial<HelpState>;
    if (x?.v !== 1) return EMPTY;
    return { ...EMPTY, ...x, tour: { ...EMPTY.tour, ...x.tour }, videos: { ...x.videos }, seen: { ...x.seen } };
  } catch {
    return EMPTY;
  }
}

export const helpKey = (userId: string) => `studio-help:${userId}`;

export function useHelpState(userId: string) {
  const [raw, setRaw] = useStored(helpKey(userId));
  const state = useMemo(() => parse(raw), [raw]);
  const update = useCallback((fn: (s: HelpState) => HelpState) => {
    let current = EMPTY;
    try { current = parse(localStorage.getItem(helpKey(userId))); } catch {}
    setRaw(JSON.stringify(fn(current)));
  }, [userId, setRaw]);
  return [state, update] as const;
}

/** Watched ≥ 90 % counts as done. */
export const DONE_AT = 0.9;
