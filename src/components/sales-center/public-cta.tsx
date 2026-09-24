"use client";
import { buttonClass } from "@/components/ui/button";

export function PublicCta({ page, href, label }: { page: string; href: string; label: string }) {
  return <a href={href} onClick={() => void fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ page, event: "cta" }), keepalive: true })}
    className={buttonClass("accent", "lg")}>{label}</a>;
}
