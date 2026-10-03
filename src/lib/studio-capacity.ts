import type { Settings } from "@/lib/data/types";

export type StudioCapacityState =
  | { status: "hidden" }
  | { status: "available"; remaining: number; total: number; window: string }
  | { status: "full"; window: string };

export function studioCapacityState(settings: Settings): StudioCapacityState {
  if (!settings.studioCapacityEnabled || settings.studioMonthlyCapacity <= 0) return { status: "hidden" };
  if (settings.studioRemainingCapacity <= 0) return { status: "full", window: settings.studioNextOnboardingWindow };
  return {
    status: "available",
    remaining: Math.min(settings.studioRemainingCapacity, settings.studioMonthlyCapacity),
    total: settings.studioMonthlyCapacity,
    window: settings.studioNextOnboardingWindow,
  };
}
