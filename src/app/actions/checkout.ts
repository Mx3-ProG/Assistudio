"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { VISITOR_COOKIE, isValidCode } from "@/lib/attribution";
import { isLocale } from "@/i18n/config";
import { isDemoMode, isStripeConfigured } from "@/lib/env";
import { log } from "@/lib/log";
import { createCheckoutSession, type CheckoutOrigin } from "@/lib/services/checkout";
import { isOfferTier } from "@/lib/offers";

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
  const rawTier = form.get("offer");
  const tier = isOfferTier(rawTier) ? rawTier : "premium";
  const back = `/${locale}/buy?offer=${tier}&unavailable=1${isValidCode(page) ? `&page=${page}` : ""}`;

  if (isDemoMode || !isStripeConfigured) redirect(back);

  let url: string;
  try {
    const jar = await cookies();
    ({ url } = await createCheckoutSession({
      locale, origin: origin as CheckoutOrigin, sessionKey: jar.get(VISITOR_COOKIE)?.value ?? null,
      privatePageSlug: isValidCode(page) ? page : null, tier,
    }));
  } catch (e) {
    log.error("payments", "checkout creation failed", { error: e });
    redirect(back);
  }
  redirect(url);
}
