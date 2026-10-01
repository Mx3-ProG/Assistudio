/**
 * Guided pipeline — "what is the next best action with this prospect?"
 * Pure (unit-tested, no framework imports).
 *
 * The WHAT (goal, why, what to do / say / show, outcomes, escalation) is
 * admin-editable content (`stage_guide`, `reply`); this module only picks the
 * right piece for a prospect and decides the timing: act now, follow up now
 * (sequence step due) or wait until a date. The ambassador sees one action.
 */
import { followUpStatus, SEQUENCE_FOR_STAGE, type FollowUpStep } from "./follow-up.ts";
import { GUIDE_STAGES, type GuideStage } from "./content.ts";

export interface GuideLike { targetKey: string | null; body: { stage: string } }
export interface ProspectLike {
  stage: string;
  createdAt: string;
  stageChangedAt?: string | null;
  nextActionAt?: string | null;
}

/** The guide for a stage: the sector override when one is published, else the generic one. */
export function guideFor<G extends GuideLike>(guides: G[], stage: string, sector: string | null): G | null {
  const forStage = guides.filter((g) => g.body.stage === stage);
  return forStage.find((g) => sector !== null && g.targetKey === sector) ?? forStage.find((g) => g.targetKey === null) ?? null;
}

export type Mode = "act" | "follow_up" | "wait";

export interface Recommendation<S> {
  mode: Mode;
  daysSince: number;
  /** follow_up: the sequence step to send now. */
  step: S | null;
  stepIndex: number | null;
  sequenceKey: string | null;
  /** wait: when the next touch is due. */
  waitUntil: string | null;
}

const DAY = 86_400_000;

export function recommend<S extends FollowUpStep>(
  p: ProspectLike, sequences: { key: string; stage: string | null; steps: S[] }[], now: number,
): Recommendation<S> {
  const since = Date.parse(p.stageChangedAt ?? p.createdAt);
  const daysSince = Number.isFinite(since) ? Math.max(0, Math.floor((now - since) / DAY)) : 0;
  const base: Recommendation<S> = { mode: "act", daysSince, step: null, stepIndex: null, sequenceKey: null, waitUntil: null };
  const seq = sequences.find((s) => s.stage === SEQUENCE_FOR_STAGE[p.stage]);
  if (!seq) return base;
  const st = followUpStatus(p, seq.steps, now);
  if (!st) return base;
  if (st.due !== null) return { ...base, mode: "follow_up", step: seq.steps[st.due], stepIndex: st.due, sequenceKey: seq.key };
  const until = st.planned ? p.nextActionAt ?? null : st.next?.at ?? null;
  return until ? { ...base, mode: "wait", waitUntil: until, sequenceKey: seq.key } : base;
}

/** Replies offered at a stage (none listed = offered everywhere). */
export function repliesFor<R extends { body: { stages?: string[] } }>(replies: R[], stage: string): R[] {
  return replies.filter((r) => !r.body.stages?.length || r.body.stages.includes(stage));
}

// ------------------------------------------------------------------ progress ("small wins")
const RANK = new Map<string, number>(GUIDE_STAGES.map((s, i) => [s, i]));
export const rankOf = (stage: string) => RANK.get(stage) ?? -1;

/** Event types that prove a stage was reached even if the prospect moved on (or was lost). */
const EVENT_STAGE: Record<string, GuideStage> = {
  message_sent: "contacted", follow_up_sent: "contacted", reply_received: "replied", need_identified: "qualified",
  interest: "interested", proof_sent: "proof_sent", offer_presented: "proposal", meeting: "appointment",
  handed_off: "handed_off", quote: "checkout", won: "won",
};

/** Number of prospects that reached each stage (current stage or any past event), lost ones included. */
export function reachedCounts(
  prospects: { id: string; stage: string }[], events: { prospectId: string; type: string; stage?: string | null }[],
): Record<GuideStage, number> {
  const best = new Map<string, number>();
  const bump = (id: string, stage: string | null | undefined) => {
    if (!stage || stage === "lost") return;
    best.set(id, Math.max(best.get(id) ?? 0, rankOf(stage)));
  };
  for (const p of prospects) bump(p.id, p.stage);
  for (const e of events) { bump(e.prospectId, EVENT_STAGE[e.type]); bump(e.prospectId, e.stage); }
  const out = Object.fromEntries(GUIDE_STAGES.map((s) => [s, 0])) as Record<GuideStage, number>;
  for (const id of new Set([...prospects.map((p) => p.id), ...events.map((e) => e.prospectId)])) {
    const r = best.get(id) ?? 0;
    for (const s of GUIDE_STAGES) if (s !== "lost" && rankOf(s) <= r) out[s]++;
  }
  return out;
}

export const FIRST_SALE_STEPS = [
  "profile", "link", "prospect", "message", "reply", "qualified", "meeting", "sale", "commission",
] as const;
export type FirstSaleStep = (typeof FIRST_SALE_STEPS)[number];

/**
 * The "first sale" path. `commissionAvailable` must count only commissions
 * that are available or paid — never pending ones (they are not earned yet).
 */
export function firstSalePath(input: {
  profileDone: boolean; approved: boolean; reached: Record<GuideStage, number>; sales: number; commissionAvailable: boolean;
}): { key: FirstSaleStep; done: boolean }[] {
  const r = input.reached;
  const done: Record<FirstSaleStep, boolean> = {
    profile: input.profileDone,
    link: input.approved,
    prospect: r.new > 0,
    message: r.contacted > 0,
    reply: r.replied > 0,
    qualified: r.qualified > 0,
    meeting: r.appointment > 0 || r.handed_off > 0,
    sale: input.sales > 0 || r.won > 0,
    commission: input.commissionAvailable,
  };
  return FIRST_SALE_STEPS.map((key) => ({ key, done: done[key] }));
}
