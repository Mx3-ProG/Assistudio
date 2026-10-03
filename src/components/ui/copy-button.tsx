"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useI18n } from "@/components/providers";
import { buttonClass } from "./button";
import { track as trackFunnel } from "@/lib/analytics/client";
import type { ClientEvent } from "@/lib/analytics/events";

/** `track`: funnel event recorded on copy (affiliate link or sales script). */
export function CopyButton({ value, label, variant = "secondary", size = "sm", className, track }: {
  value: string; label?: string; variant?: "primary" | "secondary" | "accent" | "ghost"; size?: "sm" | "md" | "lg"; className?: string;
  track?: Extract<ClientEvent, "affiliate_link_copied" | "sales_script_copied">;
}) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={buttonClass(variant, size, className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = value;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 1600);
        if (track) trackFunnel(track);
      }}
    >
      {done ? <Check className="size-4" /> : <Copy className="size-4" />}
      {done ? t.common.copied : label ?? t.common.copy}
    </button>
  );
}
