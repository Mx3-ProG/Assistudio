"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useI18n } from "@/components/providers";
import { buttonClass } from "@/components/ui/button";
import { trackUsage } from "@/app/actions/sales-center";
import { track as trackFunnel } from "@/lib/analytics/client";

async function write(value: string) {
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
}

/**
 * Copy button that also records (anonymously, by content key) which content is actually used,
 * and the activation funnel: a content kind = a sales script, a bare URL = the ambassador's link.
 */
export function TrackedCopy({ value, kind, contentKey, label, variant = "secondary", size = "sm", className }: {
  value: string; kind?: string; contentKey?: string; label?: string;
  variant?: "primary" | "secondary" | "accent" | "ghost"; size?: "sm" | "md" | "lg"; className?: string;
}) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={buttonClass(variant, size, className)}
      onClick={async () => {
        await write(value);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
        if (contentKey) void trackUsage("content_copy", { kind, key: contentKey });
        if (kind) trackFunnel("sales_script_copied", { meta: { kind } });
        else if (/^https?:\/\//.test(value)) trackFunnel("affiliate_link_copied");
      }}
    >
      {done ? <Check className="size-4" /> : <Copy className="size-4" />}
      {done ? t.common.copied : label ?? t.sc.copy}
    </button>
  );
}
