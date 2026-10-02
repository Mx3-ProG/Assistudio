"use client";
import { useEffect } from "react";

/** Attributes a private-page or affiliate-page visit once per browser session. */
export function PageBeacon({ slug, referral }: { slug?: string; referral?: string }) {
  useEffect(() => {
    const value = slug ?? referral;
    if (!value) return;
    const key = `studio-pv-${slug ? "page" : "ref"}-${value}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(slug ? { page: slug } : { referral: value }),
      keepalive: true,
    });
  }, [slug, referral]);
  return null;
}
