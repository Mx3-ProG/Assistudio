"use client";
import { useTransition } from "react";
import { ArrowRight, Check } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { advanceProspect } from "@/app/actions/guided";
import { markFollowUpSent } from "@/app/actions/sales-center";
import { useI18n } from "@/components/providers";

/** "And then?" — one button per outcome of the current step; the page re-renders with the next action. */
export function OutcomeButtons({ prospectId, outcomes }: { prospectId: string; outcomes: { label: string; to: string; event: string }[] }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      {outcomes.map((o, i) => (
        <button key={o.label} disabled={pending} onClick={() => {
          // Handing over always goes through the hand-over form, so Studio is actually told.
          if (o.to === "handed_off") {
            const el = document.getElementById("handoff") as HTMLDetailsElement | null;
            if (el) { el.open = true; el.scrollIntoView({ behavior: "smooth", block: "start" }); }
            return;
          }
          start(() => advanceProspect(prospectId, o.to, o.event));
        }}
          className={buttonClass(i === 0 ? "accent" : o.to === "lost" ? "ghost" : "secondary", "md")}>
          {i === 0 ? <Check className="size-4" /> : null}{o.label}{i === 0 ? <ArrowRight className="flip-rtl size-4" /> : null}
        </button>
      ))}
    </div>
  );
}

export function FollowUpSentButton({ prospectId, sequenceKey }: { prospectId: string; sequenceKey: string }) {
  const { t, locale } = useI18n();
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} onClick={() => start(async () => { await markFollowUpSent(prospectId, sequenceKey, locale); })} className={buttonClass("accent", "md")}>
      <Check className="size-4" />{t.gd.prospect.followUpSent}
    </button>
  );
}
