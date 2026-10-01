/**
 * Next best action for a prospect — pure (unit-tested).
 *
 * Deliberately simple and explainable: one rule per CRM stage, thresholds from
 * admin settings, the affiliate's own planned action always wins, and nothing
 * is ever sent automatically — the result is a suggestion with a reason and a
 * link to the right resource.
 */

export type Stage =
  | "new" | "contacted" | "replied" | "qualified" | "interested" | "proof_sent" | "appointment" | "proposal"
  | "handed_off" | "checkout" | "won" | "lost";

export type ActionKind =
  | "planned" | "send_first_message" | "wait_reply" | "follow_up" | "qualify_call" | "book_appointment"
  | "prepare_appointment" | "send_sales_page" | "wait_decision" | "follow_up_proposal" | "checkout_wait"
  | "checkout_check_in" | "nurture" | "revisit";

export type ResourceSection = "messages" | "emails" | "calls" | "playbooks" | "pages";

export interface NextAction {
  kind: ActionKind;
  /** Days used in the explanation ("no reply for 4 days"). */
  days: number;
  dueAt: string | null;
  urgent: boolean;
  resource: { section: ResourceSection; stage?: string } | null;
}

export interface ProspectLike {
  stage: Stage;
  createdAt: string;
  stageChangedAt?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
}

export interface Rules {
  followUpDays: number;
  checkoutCheckInDays: number;
  revisitLostDays: number;
}
export const DEFAULT_RULES: Rules = { followUpDays: 3, checkoutCheckInDays: 2, revisitLostDays: 90 };

const DAY = 86_400_000;

export function nextBestAction(p: ProspectLike, now: number, rules: Rules = DEFAULT_RULES): NextAction | null {
  const since = Date.parse(p.stageChangedAt ?? p.createdAt);
  const days = Math.max(0, Math.floor((now - since) / DAY));
  const at = (d: number) => new Date(since + d * DAY).toISOString();
  const planned = p.nextActionAt ? Date.parse(p.nextActionAt) : NaN;
  const a = (kind: ActionKind, o: Partial<NextAction> = {}): NextAction =>
    ({ kind, days, dueAt: null, urgent: false, resource: null, ...o });

  if (p.stage === "won") return a("nurture", { resource: { section: "messages", stage: "renewal" } });
  if (p.stage === "lost") {
    return days >= rules.revisitLostDays ? a("revisit", { resource: { section: "messages", stage: "follow_up" } }) : null;
  }
  // The affiliate's own plan wins while it is in the future.
  if (p.nextAction && Number.isFinite(planned) && planned > now) {
    return a("planned", { dueAt: new Date(planned).toISOString() });
  }

  switch (p.stage) {
    case "new":
      return a("send_first_message", { urgent: days >= 1, resource: { section: "messages", stage: "first_contact" } });
    case "contacted":
      return days >= rules.followUpDays
        ? a("follow_up", { urgent: true, resource: { section: "messages", stage: "no_response" } })
        : a("wait_reply", { dueAt: at(rules.followUpDays) });
    case "replied":
      return a("qualify_call", { urgent: true, resource: { section: "calls" } });
    case "qualified":
    case "interested":
      return a("book_appointment", { resource: { section: "messages", stage: "interested" } });
    case "appointment":
      return Number.isFinite(planned) && planned > now
        ? a("prepare_appointment", { dueAt: new Date(planned).toISOString(), resource: { section: "playbooks" } })
        : a("send_sales_page", { urgent: true, resource: { section: "pages" } });
    case "proposal":
      return days >= rules.followUpDays
        ? a("follow_up_proposal", { resource: { section: "emails", stage: "proposal" } })
        : a("wait_decision", { dueAt: at(rules.followUpDays) });
    case "checkout":
      // Never chase automatically: one personal check-in, once.
      return days >= rules.checkoutCheckInDays
        ? a("checkout_check_in", { resource: { section: "messages", stage: "closing" } })
        : a("checkout_wait", { dueAt: at(rules.checkoutCheckInDays) });
  }
  return null;
}
