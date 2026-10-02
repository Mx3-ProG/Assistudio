"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { REF_COOKIE_MAX_AGE, VISITOR_COOKIE, isValidCode } from "@/lib/attribution";
import { isLocale } from "@/i18n/config";
import { currencies, isCurrency } from "@/i18n/currency";
import { isDemoMode, isEmbeddedCheckoutConfigured, isStripeConfigured } from "@/lib/env";
import { log } from "@/lib/log";
import { createCheckoutSession, type CheckoutOrigin } from "@/lib/services/checkout";
import { isBillingCadence, isOfferTier } from "@/lib/offers";
import { normalizePromoCode } from "@/lib/services/promo";

const embeddedInput = z.object({
  locale: z.string(),
  origin: z.enum(["public", "affiliate_link", "private_page", "dashboard_cta"]),
  page: z.string().nullable(),
  referral: z.string().nullable(),
  offer: z.enum(["one", "pro", "premium"]),
  billing: z.enum(["annual", "monthly"]),
  currency: z.enum(currencies),
  promo: z.string().nullable(),
});

async function checkoutVisitorKey() {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return existing;
  const value = crypto.randomUUID();
  jar.set(VISITOR_COOKIE, value, {
    path: "/", maxAge: REF_COOKIE_MAX_AGE, sameSite: "lax", httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  return value;
}

/** Creates the Stripe Session used by the embedded form. All commercial and
 * attribution data is resolved again on the server; the browser only provides
 * the selected route inputs. */
export async function createEmbeddedCheckout(input: unknown) {
  const parsed = embeddedInput.parse(input);
  if (!isLocale(parsed.locale) || isDemoMode || !isEmbeddedCheckoutConfigured) {
    throw new Error("embedded checkout unavailable");
  }
  const sessionKey = await checkoutVisitorKey();
  const result = await createCheckoutSession({
    locale: parsed.locale,
    origin: parsed.origin,
    sessionKey,
    privatePageSlug: parsed.page && isValidCode(parsed.page) ? parsed.page : null,
    referralCode: parsed.referral && isValidCode(parsed.referral) ? parsed.referral : null,
    tier: parsed.offer,
    cadence: parsed.offer === "one" ? "annual" : parsed.billing,
    currency: parsed.currency,
    promoCode: normalizePromoCode(parsed.promo),
    uiMode: "embedded",
  });
  if (!result.clientSecret) throw new Error("embedded checkout unavailable");
  return { clientSecret: result.clientSecret, sessionId: result.sessionId };
}

/**
 * Starts a Stripe Checkout. Everything that matters (price, attribution) is
 * resolved on the server; the form only says where the visitor comes from.
 */
export async function startCheckout(form: FormData) {
  const rawLocale = String(form.get("locale") ?? "en");
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const page = String(form.get("page") ?? "");
  const referral = String(form.get("referral") ?? "");
  const origin = (["public", "affiliate_link", "private_page", "dashboard_cta"] as const)
    .find((o) => o === form.get("origin")) ?? "public";
  const rawTier = form.get("offer");
  const tier = isOfferTier(rawTier) ? rawTier : "premium";
  const rawCadence = form.get("billing");
  const cadence = isBillingCadence(rawCadence) ? rawCadence : "annual";
  const rawCurrency = String(form.get("currency") ?? "EUR").toUpperCase();
  const currency = isCurrency(rawCurrency) ? rawCurrency : "EUR";
  const promoCode = normalizePromoCode(form.get("promo"));
  const back = `/${locale}/buy?offer=${tier}&billing=${cadence}&currency=${currency}&unavailable=1${isValidCode(page) ? `&page=${page}` : ""}${isValidCode(referral) ? `&referral=${encodeURIComponent(referral)}` : ""}${promoCode ? `&promo=${encodeURIComponent(promoCode)}` : ""}`;

  if (isDemoMode || !isStripeConfigured) redirect(back);

  let url: string | null;
  try {
    const sessionKey = await checkoutVisitorKey();
    ({ url } = await createCheckoutSession({
      locale, origin: origin as CheckoutOrigin, sessionKey,
      privatePageSlug: isValidCode(page) ? page : null,
      referralCode: isValidCode(referral) ? referral : null, tier, cadence,
      currency,
      promoCode,
    }));
  } catch (e) {
    log.error("payments", "checkout creation failed", { error: e });
    redirect(back);
  }
  if (!url) redirect(back);
  redirect(url);
}
