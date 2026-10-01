/**
 * Follow-up sequences on the existing CRM — pure (unit-tested).
 *
 * A sequence (`sales_content` kind "sequence") lists steps at J+N after the
 * prospect entered its current stage. No extra state is stored: the step due
 * is the latest one whose day has passed, and "mark as sent" simply plans the
 * next step in the prospect's own `nextAction` / `nextActionAt` fields, which
 * the CRM already shows and respects. Nothing is ever sent automatically.
 */

export interface FollowUpStep { day: number }

export interface ProspectForFollowUp {
  stage: string;
  createdAt: string;
  stageChangedAt?: string | null;
  nextActionAt?: string | null;
}

/** Which sequence (by its content `stage`) applies to a CRM stage. */
export const SEQUENCE_FOR_STAGE: Record<string, string> = {
  contacted: "follow_up",
  proposal: "proposal",
  checkout: "proposal",
};

export interface FollowUpStatus {
  /** Index of the step to send now (null: nothing due yet). */
  due: number | null;
  /** The step after `due` (or the first one when nothing is due yet). */
  next: { index: number; at: string } | null;
  daysSince: number;
  /** The ambassador planned something in the future: respect it. */
  planned: boolean;
}

const DAY = 86_400_000;

export function followUpStatus(p: ProspectForFollowUp, steps: FollowUpStep[], now: number): FollowUpStatus | null {
  if (!steps.length || !(p.stage in SEQUENCE_FOR_STAGE)) return null;
  const since = Date.parse(p.stageChangedAt ?? p.createdAt);
  if (!Number.isFinite(since)) return null;
  const daysSince = Math.max(0, Math.floor((now - since) / DAY));
  const plannedAt = p.nextActionAt ? Date.parse(p.nextActionAt) : NaN;
  const planned = Number.isFinite(plannedAt) && plannedAt > now;

  let due: number | null = null;
  steps.forEach((s, i) => { if (s.day <= daysSince) due = i; });
  const nextIndex = due === null ? 0 : due + 1;
  const next = nextIndex < steps.length ? { index: nextIndex, at: new Date(since + steps[nextIndex].day * DAY).toISOString() } : null;
  return { due: planned ? null : due, next, daysSince, planned };
}

/** When "mark as sent" is pressed: the date to plan the next step at (null = sequence finished). */
export function nextPlannedAt(p: ProspectForFollowUp, steps: FollowUpStep[], now: number): { index: number; at: string } | null {
  const st = followUpStatus({ ...p, nextActionAt: null }, steps, now);
  if (!st?.next) return null;
  // Never plan in the past: an overdue next step is planned for tomorrow.
  const at = Math.max(Date.parse(st.next.at), now + DAY);
  return { index: st.next.index, at: new Date(at).toISOString() };
}

export interface SequenceLike<S extends FollowUpStep> { key: string; stage: string | null; steps: S[] }
export interface FollowUpRow<P, S> { prospect: P; sequenceKey: string; status: FollowUpStatus; step: S | null; next: S | null }

/** Every prospect with an applicable sequence, due ones first (most overdue first), then the planned ones by date. */
export function followUpBoard<P extends ProspectForFollowUp, S extends FollowUpStep>(prospects: P[], sequences: SequenceLike<S>[], now: number): FollowUpRow<P, S>[] {
  const rows: FollowUpRow<P, S>[] = [];
  for (const p of prospects) {
    const seq = sequences.find((s) => s.stage === SEQUENCE_FOR_STAGE[p.stage]);
    if (!seq) continue;
    const status = followUpStatus(p, seq.steps, now);
    if (!status || (status.due === null && !status.next)) continue;
    rows.push({ prospect: p, sequenceKey: seq.key, status, step: status.due === null ? null : seq.steps[status.due], next: status.next ? seq.steps[status.next.index] : null });
  }
  const when = (r: FollowUpRow<P, S>) => (r.status.planned && r.prospect.nextActionAt ? Date.parse(r.prospect.nextActionAt) : Date.parse(r.status.next?.at ?? "") || Infinity);
  return rows.sort((a, b) =>
    Number(b.status.due !== null) - Number(a.status.due !== null) || (a.status.due !== null ? b.status.daysSince - a.status.daysSince : when(a) - when(b)));
}
