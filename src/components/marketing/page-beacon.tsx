"use client";
import { useEffect } from "react";

/** Attributes a private-page visit once per browser session. */
export function PageBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `studio-pv-${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ page: slug }),
      keepalive: true,
    });
  }, [slug]);
  return null;
}
