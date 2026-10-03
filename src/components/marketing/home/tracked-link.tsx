"use client";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { track } from "@/lib/analytics/client";
import type { ClientEvent } from "@/lib/analytics/events";

/** A CTA link that records one funnel event (no identifier) before navigating. */
export function TrackedLink({ href, event, placement, variant = "accent", size = "lg", className, children }: {
  href: string; event: ClientEvent; placement: string;
  variant?: Parameters<typeof buttonClass>[0]; size?: Parameters<typeof buttonClass>[1]; className?: string; children: React.ReactNode;
}) {
  return (
    <Link href={href} onClick={() => track(event, { placement })} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
