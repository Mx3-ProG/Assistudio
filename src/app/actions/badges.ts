"use server";
import { revalidatePath } from "next/cache";
import { getSession, repo } from "@/lib/data";
import { isStaff } from "@/lib/auth";
import { getBadges, HELP_NOTIFICATION_KEYS } from "@/lib/badges";

/** Sum of the red-dot counts — polled in demo mode (production uses Realtime). */
export async function badgeTotal(scope: "admin" | "dashboard"): Promise<number | null> {
  const s = await getSession();
  if (!s || (scope === "admin" && !isStaff(s))) return null;
  const b = await getBadges(s, scope);
  return b.messages + b.notifications + b.help;
}

/** Opening a help page reads the notifications that point to it (partner: replies; staff: new requests). */
export async function markHelpSeen(scope: "admin" | "dashboard"): Promise<void> {
  const s = await getSession();
  if (!s) return;
  const keys = scope === "admin" && isStaff(s) ? HELP_NOTIFICATION_KEYS.staff : HELP_NOTIFICATION_KEYS.partner;
  await repo().markNotificationsRead(s, keys);
  revalidatePath(`/[locale]/${scope}`, "layout");
}
