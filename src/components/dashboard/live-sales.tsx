"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hourglass, BadgeCheck, X } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/money";
import { fmt } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

/**
 * Realtime, where it matters: while the affiliate is on the dashboard, a
 * confirmed sale or a newly available commission appears without a refresh.
 * Subscribes to the affiliate's own activity rows (RLS applies to Realtime).
 */
export function LiveSales({ affiliateId, locale, text, enabled }: {
  affiliateId: string;
  locale: Locale;
  text: { sale: string; available: string };
  enabled: boolean;
}) {
  const router = useRouter();
  const [toast, setToast] = useState<{ kind: "pending" | "available"; label: string } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const sb = supabaseBrowser();
    const channel = sb
      .channel(`activity:${affiliateId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_events", filter: `affiliate_id=eq.${affiliateId}` },
        (msg) => {
          const row = msg.new as { type: string; payload: Record<string, unknown> };
          const cents = typeof row.payload?.commission_cents === "number" ? row.payload.commission_cents : null;
          const currency = typeof row.payload?.currency === "string" ? row.payload.currency : "EUR";
          if (cents === null) return;
          if (row.type === "commission_pending") {
            setToast({ kind: "pending", label: fmt(text.sale, { amount: formatMoney(cents, locale, currency) }) });
            router.refresh();
          } else if (row.type === "commission_available") {
            setToast({ kind: "available", label: fmt(text.available, { amount: formatMoney(cents, locale, currency) }) });
            router.refresh();
          }
        })
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [affiliateId, enabled, locale, router, text.available, text.sale]);

  if (!toast) return null;
  const Icon = toast.kind === "pending" ? Hourglass : BadgeCheck;
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-lg animate-rise sm:inset-x-auto sm:end-6">
      <span className={toast.kind === "pending" ? "grid size-9 place-items-center rounded-full bg-warning-soft text-warning" : "grid size-9 place-items-center rounded-full bg-success-soft text-success"}>
        <Icon className="size-4" />
      </span>
      <p className="flex-1 text-[14px] font-medium">{toast.label}</p>
      <button onClick={() => setToast(null)} className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2" aria-label="Close">
        <X className="size-4" />
      </button>
    </div>
  );
}
