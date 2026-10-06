import { BadgeCheck, FlaskConical } from "lucide-react";
import { cn } from "@/lib/cn";

/** "Verified review": only rendered when the database computed `verified` (never a prop typed by hand in copy). */
export function VerifiedBadge({ label, hint, className }: { label: string; hint?: string; className?: string }) {
  return (
    <span title={hint} className={cn("inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11.5px] font-semibold text-success", className)}>
      <BadgeCheck className="size-3.5" aria-hidden />{label}
    </span>
  );
}

/**
 * Mandatory label of anything illustrative ("Simulation", "Exemple de
 * fonctionnement"). Visually loud on purpose: a simulation must never read as
 * a partner's real income or a real client's words.
 */
export function DemoBadge({ label, hint, className }: { label: string; hint?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-dashed border-warning/60 bg-warning-soft px-2 py-0.5 text-[11.5px] font-semibold text-warning", className)}>
      <FlaskConical className="size-3.5" aria-hidden />{label}
      {hint && <span className="sr-only"> — {hint}</span>}
    </span>
  );
}
