"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { repo, getSession } from "@/lib/data";
import { isStaff } from "@/lib/auth";
import { isLocale } from "@/i18n/config";
import { log } from "@/lib/log";
import { kickEmailOutbox } from "@/lib/email/service";
import { PayoutError, type PayoutErrorCode } from "@/lib/payouts";
import { connectOnboardingUrl, connectDashboardUrl } from "@/lib/services/payouts";

/** The affiliate is always the session's — never read from the form. */
export async function startConnectOnboarding(form: FormData) {
  const s = await getSession();
  if (!s?.affiliate) throw new Error("Unauthorized");
  const locale = String(form.get("locale") ?? "en");
  let url: string;
  try {
    url = await connectOnboardingUrl(s, isLocale(locale) ? locale : "en");
  } catch (e) {
    log.error("payouts", "connect onboarding failed", { error: e });
    redirect(`/${isLocale(locale) ? locale : "en"}/dashboard/payouts/settings?error=1`);
  }
  redirect(url);
}

export async function openConnectDashboard(form: FormData) {
  const s = await getSession();
  if (!s?.affiliate) throw new Error("Unauthorized");
  const locale = String(form.get("locale") ?? "en");
  let url: string;
  try {
    url = await connectDashboardUrl(s);
  } catch (e) {
    log.error("payouts", "connect dashboard link failed", { error: e });
    redirect(`/${isLocale(locale) ? locale : "en"}/dashboard/payouts/settings?error=1`);
  }
  redirect(url);
}

/**
 * Payout requests. The partner sends a WISH (amount + idempotency key); the
 * database recomputes the balance, checks the minimum, ownership, one open
 * request, and allocates the commissions in one locked transaction. Nothing
 * here trusts the browser beyond parsing.
 */
export type PayoutActionState =
  | { ok: true; ref: string; amountCents: number }
  | { ok?: false; error?: PayoutErrorCode | "generic" };

/** "3 000,50" / "3000.5" / "3 000 €" → 300050 cents, or null. */
function toCents(raw: unknown): number | null {
  const s = String(raw ?? "").replace(/[\s  €]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

export async function requestPayoutAction(_: PayoutActionState, f: FormData): Promise<PayoutActionState> {
  const s = await getSession();
  if (!s) return { error: "unauthenticated" };
  if (!s.affiliate) return { error: "no_affiliate" };
  const amountCents = toCents(f.get("amount"));
  const key = z.string().trim().min(8).max(80).safeParse(f.get("key"));
  if (amountCents === null || !key.success) return { error: "invalid_amount" };
  try {
    const r = await repo().requestPayout(s, amountCents, key.data);
    revalidatePath("/[locale]/dashboard", "layout");
    kickEmailOutbox(); // confirmation to the partner + alert to every admin, sent right after the response
    return { ok: true, ref: r.ref, amountCents: r.amountCents };
  } catch (e) {
    if (e instanceof PayoutError) return { error: e.code };
    log.error("payouts", "request failed", { error: e instanceof Error ? e.message : String(e) });
    return { error: "generic" };
  }
}

// ---------------------------------------------------------------- staff
export type StaffPayoutState = { ok?: boolean; error?: PayoutErrorCode | "forbidden" | "generic"; detail?: string };

async function asStaff(fn: (s: NonNullable<Awaited<ReturnType<typeof getSession>>>) => Promise<unknown>): Promise<StaffPayoutState> {
  const s = await getSession();
  if (!isStaff(s)) return { error: "forbidden" };
  try {
    await fn(s!);
    revalidatePath("/[locale]/admin", "layout");
    kickEmailOutbox();
    return { ok: true };
  } catch (e) {
    if (e instanceof PayoutError) return { error: e.code, detail: e.detail };
    log.error("payouts", "staff action failed", { error: e instanceof Error ? e.message : String(e) });
    return { error: "generic" };
  }
}
const payoutId = (f: FormData) => z.string().min(1).max(100).parse(f.get("id"));
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim().slice(0, 500);

export async function processPayoutAction(_: StaffPayoutState, f: FormData) {
  return asStaff((s) => repo().adminProcessPayout(s, payoutId(f), text(f, "note") || null));
}
export async function markPayoutPaidAction(_: StaffPayoutState, f: FormData) {
  const ref = text(f, "reference");
  if (!ref) return { error: "reference_required" } satisfies StaffPayoutState;
  return asStaff((s) => repo().adminMarkPayoutPaid(s, payoutId(f), ref));
}
export async function rejectPayoutAction(_: StaffPayoutState, f: FormData) {
  const reason = text(f, "reason");
  if (!reason) return { error: "reason_required" } satisfies StaffPayoutState;
  return asStaff((s) => repo().adminRejectPayout(s, payoutId(f), reason));
}
export async function failPayoutAction(_: StaffPayoutState, f: FormData) {
  const reason = text(f, "reason");
  if (!reason) return { error: "reason_required" } satisfies StaffPayoutState;
  return asStaff((s) => repo().adminFailPayout(s, payoutId(f), reason));
}
