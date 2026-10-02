import "server-only";
import { repo } from "@/lib/data";
import { isStaff } from "@/lib/auth";
import type { Session } from "@/lib/data/types";

/**
 * The red dots on the Messages, Help / Support and Notifications icons — the
 * same counts for partners and staff, so nothing waiting is ever invisible.
 *
 *   messages:      unread messages (staff: + unread member Support threads)
 *   notifications: unread notifications
 *   help:          partner → unread replies to their help requests
 *                  staff   → open help requests nobody has taken yet
 */
export interface Badges { messages: number; notifications: number; help: number }

/** Notification keys tied to the Help icon; reading the help page marks them read. */
export const HELP_NOTIFICATION_KEYS = { partner: ["helpUpdated"], staff: ["helpNew"] } as const;

export async function getBadges(s: Session, scope: "admin" | "dashboard"): Promise<Badges> {
  const r = repo();
  const staff = isStaff(s);
  const [own, inbox, unreadNotifications, openHelp] = await Promise.all([
    r.getUnreadMessageCount(s).catch(() => 0),
    staff && scope === "admin" ? r.listSupportInbox(s).catch(() => []) : Promise.resolve([]),
    r.listNotifications(s, "unread").catch(() => []),
    staff ? r.adminListHelpRequests(s, { status: ["open"] }).catch(() => []) : Promise.resolve([]),
  ]);
  const partnerHelp = unreadNotifications.filter((n) => (HELP_NOTIFICATION_KEYS.partner as readonly string[]).includes(n.titleKey)).length;
  return {
    messages: own + inbox.reduce((a, x) => a + x.unread, 0),
    notifications: unreadNotifications.length,
    help: scope === "admin" ? openHelp.length : partnerHelp,
  };
}

/** Staff seen from the partner dashboard: open help requests (dot on the Admin link). */
export async function staffOpenHelp(s: Session): Promise<number> {
  if (!isStaff(s)) return 0;
  return (await repo().adminListHelpRequests(s, { status: ["open"] }).catch(() => [])).length;
}
