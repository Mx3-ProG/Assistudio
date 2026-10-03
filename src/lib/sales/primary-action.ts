/**
 * The ONE action the ambassador dashboard puts first — pure, unit-tested.
 * Built on top of `nextActions()` (already sorted: follow-ups due, then
 * actions, then waits), so the dashboard never asks "what now?".
 */
export type PrimaryKind =
  | "onboarding" | "noProspect" | "message" | "followUp" | "demo" | "handoff" | "proposal" | "nextOpportunity";

export interface PrimaryInput {
  onboardingDone: boolean;
  /** Prospects ever created (any stage, lost included). */
  prospectCount: number;
  /** First item of nextActions(): open prospects only. */
  top: { id: string; name: string; stage: string; mode: "act" | "follow_up" | "wait" } | null;
}

export interface PrimaryAction {
  kind: PrimaryKind;
  prospect: { id: string; name: string } | null;
  /** Dashboard-relative path ("" = dashboard home). */
  path: string;
}

const STAGE_KIND: Record<string, PrimaryKind> = {
  new: "message",
  contacted: "followUp",
  replied: "demo", qualified: "demo", interested: "demo", proof_sent: "demo",
  appointment: "handoff",
  proposal: "proposal", checkout: "proposal",
};

export function primaryAction(i: PrimaryInput): PrimaryAction {
  if (!i.onboardingDone && i.prospectCount === 0) return { kind: "onboarding", prospect: null, path: "/welcome" };
  if (i.prospectCount === 0) return { kind: "noProspect", prospect: null, path: "/prospects?new=1" };
  const kind = i.top && i.top.mode !== "wait" ? STAGE_KIND[i.top.stage] : undefined;
  if (!i.top || !kind) return { kind: "nextOpportunity", prospect: null, path: "/prospects?new=1" };
  return {
    kind,
    prospect: { id: i.top.id, name: i.top.name },
    path: `/prospects/${i.top.id}${kind === "handoff" ? "#handoff" : ""}`,
  };
}
