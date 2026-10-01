"use client";
import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** False during SSR and hydration, true afterwards: for clock/time-zone dependent text. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
