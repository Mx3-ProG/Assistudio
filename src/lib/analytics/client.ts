"use client";
import type { ClientEvent } from "./events";

/**
 * Fire-and-forget funnel beacon. No cookie, no identifier: the server attaches
 * the ambassador only when a session exists. Never throws, never blocks a click.
 */
export function track(event: ClientEvent, opts: { placement?: string; meta?: Record<string, string | number | boolean> } = {}) {
  try {
    const locale = window.location.pathname.split("/")[1] || undefined;
    const body = JSON.stringify({ event, placement: opts.placement, locale, meta: opts.meta });
    if (navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => undefined);
  } catch {}
}

/** Same as `track`, at most once per browser tab session for the given key. */
export function trackOnce(key: string, event: ClientEvent, opts?: Parameters<typeof track>[1]) {
  try {
    const k = `studio-fe-${key}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch {}
  track(event, opts);
}
