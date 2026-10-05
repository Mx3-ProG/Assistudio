"use client";
import { Lightbulb } from "lucide-react";
import { useI18n } from "@/components/providers";
import { useIsClient } from "@/lib/hooks/use-stored";
import { buttonClass } from "@/components/ui/button";
import { useHelp } from "./help-context";

/**
 * Micro-onboarding: one sentence the first time a key page is opened, gone
 * after "Got it" — and never shown for a page the guided tour already explained.
 * `id` is the page path under /{locale} (same key the tour marks as seen).
 */
export function FirstVisitHint({ id, text }: { id: string; text: string }) {
  const { t } = useI18n();
  const { state, update } = useHelp();
  const client = useIsClient();
  if (!client || state.seen[id] || state.tour.status === "active" || state.tour.status === "done") return null;
  return (
    <div role="note" className="mb-5 flex flex-col gap-3 rounded-[20px] border border-accent/30 bg-accent-soft p-4 sm:flex-row sm:items-center">
      <Lightbulb className="hidden size-5 shrink-0 text-accent sm:block" aria-hidden />
      <p className="flex-1 text-[14px] leading-relaxed text-fg">{text}</p>
      <button type="button" onClick={() => update((s) => ({ ...s, seen: { ...s.seen, [id]: true } }))} className={buttonClass("secondary", "sm", "self-start sm:self-auto")}>
        {t.hp.hints.ok}
      </button>
    </div>
  );
}
