"use server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/data";
import { isLocale } from "@/i18n/config";
import { log } from "@/lib/log";
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
