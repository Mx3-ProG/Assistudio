"use client";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Per-browser persisted value (localStorage) exposed as external state, so it
 * is SSR-safe (server snapshot = fallback) and never causes effect cascades.
 * Storage failures (private mode, blocked site data) fall back silently.
 */
const EVENT = "studio-storage";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function useStored(key: string, fallback: string | null = null): [string | null, (v: string | null) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key) ?? fallback, () => fallback);
  const set = useCallback((v: string | null) => writeStored(key, v), [key]);
  return [value, set];
}

const noop = () => () => {};
/** true on the client after hydration, false during SSR. */
export function useIsClient() {
  return useSyncExternalStore(noop, () => true, () => false);
}
