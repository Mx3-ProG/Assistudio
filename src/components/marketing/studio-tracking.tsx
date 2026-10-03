"use client";

import { useEffect, useRef } from "react";
import { track, trackOnce } from "@/lib/analytics/client";
import type { ClientEvent } from "@/lib/analytics/events";

export function StudioViewBeacon({ surface = "studio" }: { surface?: "studio" | "buy" }) {
  useEffect(() => {
    trackOnce(surface, surface === "buy" ? "studio_buy_view" : "studio_view", { placement: surface });
  }, [surface]);
  return null;
}

export function StudioSectionBeacon({ event, placement }: { event: ClientEvent; placement: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      trackOnce(`${event}-${placement}`, event, { placement });
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [event, placement]);
  return <span ref={ref} aria-hidden className="sr-only" />;
}

export function studioTrack(event: ClientEvent, placement: string, meta?: Record<string, string | number | boolean>) {
  track(event, { placement, meta });
}
