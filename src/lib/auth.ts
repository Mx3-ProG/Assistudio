import "server-only";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/data";
import type { Session } from "@/lib/data/types";
import type { Locale } from "@/i18n/config";

export const isStaff = (s: Session | null) => !!s && (s.role === "super_admin" || s.role === "admin");

/** Server-side guard: every dashboard page and server action calls this. */
export async function requireSession(locale: Locale): Promise<Session> {
  const s = await getSession();
  if (!s) redirect(`/${locale}/login`);
  return s;
}

export async function requireAffiliate(locale: Locale): Promise<Session & { affiliate: NonNullable<Session["affiliate"]> }> {
  const s = await requireSession(locale);
  if (!s.affiliate) {
    if (isStaff(s)) redirect(`/${locale}/admin`);
    notFound();
  }
  return s as Session & { affiliate: NonNullable<Session["affiliate"]> };
}

export async function requireStaff(locale: Locale): Promise<Session> {
  const s = await requireSession(locale);
  if (!isStaff(s)) notFound();
  return s;
}
