"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { VISITOR_COOKIE, isValidCode } from "@/lib/attribution";
import { isLocale } from "@/i18n/config";
import { isDemoMode, isEmbeddedCheckoutConfigured, isStripeConfigured } from "@/lib/env";
import { log } from "@/lib/log";
import { createCheckoutSession, type CheckoutOrigin } from "@/lib/services/checkout";
import { isBillingCadence, isOfferTier } from "@/lib/offers";
import { normalizePromoCode } from "@/lib/services/promo";

const embeddedInput = z.object({
  locale: z.string(),
  origin: z.enum(["public", "affiliate_link", "private_page", "dashboard_cta"]),
  page: z.string().nullable(),
  offer: z.enum(["one", "pro", "premium"]),
  billing: z.enum(["annual", "monthly"]),
  promo: z.string().nullable(),
});

/** Creates the Stripe Session used by the embedded form. All commercial and
 * attribution data is resolved again on the server; the browser only provides
 * the selected route inputs. */
export async function createEmbeddedCheckout(input: unknown) {
  const parsed = embeddedInput.parse(input);
  if (!isLocale(parsed.locale) || isDemoMode || !isEmbeddedCheckoutConfigured) {
    throw new Error("embedded checkout unavailable");
  }
  const jar = await cookies();
  const result = await createCheckoutSession({
    locale: parsed.locale,
    origin: parsed.origin,
    sessionKey: jar.get(VISITOR_COOKIE)?.value ?? null,
    privatePageSlug: parsed.page && isValidCode(parsed.page) ? parsed.page : null,
    tier: parsed.offer,
    cadence: parsed.offer === "one" ? "annual" : parsed.billing,
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
  const origin = (["public", "affiliate_link", "private_page", "dashboard_cta"] as const)
    .find((o) => o === form.get("origin")) ?? "public";
  const rawTier = form.get("offer");
  const tier = isOfferTier(rawTier) ? rawTier : "premium";
  const rawCadence = form.get("billing");
  const cadence = isBillingCadence(rawCadence) ? rawCadence : "annual";
  const promoCode = normalizePromoCode(form.get("promo"));
  const back = `/${locale}/buy?offer=${tier}&billing=${cadence}&unavailable=1${isValidCode(page) ? `&page=${page}` : ""}${promoCode ? `&promo=${encodeURIComponent(promoCode)}` : ""}`;

  if (isDemoMode || !isStripeConfigured) redirect(back);

  let url: string | null;
  try {
    const jar = await cookies();
    ({ url } = await createCheckoutSession({
      locale, origin: origin as CheckoutOrigin, sessionKey: jar.get(VISITOR_COOKIE)?.value ?? null,
      privatePageSlug: isValidCode(page) ? page : null, tier, cadence,
      promoCode,
    }));
  } catch (e) {
    log.error("payments", "checkout creation failed", { error: e });
    redirect(back);
  }
  if (!url) redirect(back);
  redirect(url);
}
