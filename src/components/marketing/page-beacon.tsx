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
    } catch {}
    void (async () => {
      try {
        const response = await fetch("/api/track", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(slug ? { page: slug } : { referral: value }),
          keepalive: true,
        });
        if (response.ok) sessionStorage.setItem(key, "1");
      } catch {}
    })();
  }, [slug, referral]);
  return null;
}
