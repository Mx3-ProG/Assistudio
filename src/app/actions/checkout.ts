"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { VISITOR_COOKIE, isValidCode } from "@/lib/attribution";
import { isLocale } from "@/i18n/config";
import { isDemoMode, isStripeConfigured } from "@/lib/env";
import { log } from "@/lib/log";
import { createCheckoutSession, type CheckoutOrigin } from "@/lib/services/checkout";

/**
 * Starts a Stripe Checkout. Everything that matters (price, attribution) is
 * resolved on the server; the form only says where the visitor comes from.
 */
export async function startCheckout(form: FormData) {
  const rawLocale = String(form.get("locale") ?? "en");
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const page = String(form.get("page") ?? "");
  const origin = (["public", "affiliate_link", "private_page", "dashboard_cta"] as const)
    .find((o) => o === form.get("origin")) ?? "public";

  if (isDemoMode || !isStripeConfigured) redirect(`/${locale}/buy?unavailable=1`);

  let url: string;
  try {
    const jar = await cookies();
    ({ url } = await createCheckoutSession({
      locale, origin: origin as CheckoutOrigin, sessionKey: jar.get(VISITOR_COOKIE)?.value ?? null,
      privatePageSlug: isValidCode(page) ? page : null,
    }));
  } catch (e) {
    log.error("payments", "checkout creation failed", { error: e });
    redirect(`/${locale}/buy?unavailable=1${isValidCode(page) ? `&page=${page}` : ""}`);
  }
  redirect(url);
}
