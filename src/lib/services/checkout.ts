import "server-only";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { supabaseService } from "@/lib/supabase/server";
import { stripe, checkoutLocale, stripeMode } from "@/lib/services/stripe";
import { resolveCheckoutAttribution } from "@/lib/services/attribution";
import { CHECKOUT_METADATA_KEY } from "@/lib/stripe/normalize";
import type { Locale } from "@/i18n/config";
import { OFFER_LOOKUP_KEYS, type OfferTier } from "@/lib/offers";
import { discountCents } from "@/lib/services/promo";

export type CheckoutOrigin = "public" | "affiliate_link" | "private_page" | "dashboard_cta";

export class CheckoutUnavailableError extends Error {}

interface OfferRow {
  id: string;
  product_id: string;
  price_cents: number;
  currency: string;
  price_type: "recurring" | "one_time";
  billing_interval: "month" | "year" | "one_time";
  interval_count: number;
  stripe_price_id: string | null;
  stripe_lookup_key: string | null;
}

/** The active Studio ATS offer of a tier (One, Pro or Premium), by its stable lookup key. */
async function activeOffer(productSlug: string, tier: OfferTier): Promise<OfferRow> {
  const { data, error } = await supabaseService()
    .from("offers")
    .select("id, product_id, price_cents, currency, price_type, billing_interval, interval_count, stripe_price_id, stripe_lookup_key, products!inner(slug)")
    .eq("products.slug", productSlug).eq("is_active", true).eq("stripe_lookup_key", OFFER_LOOKUP_KEYS[tier])
    .maybeSingle();
  if (error || !data) throw new CheckoutUnavailableError(`no active ${tier} offer for ${productSlug}`);
  return data as unknown as OfferRow;
}

/**
 * Resolves the Stripe price for an offer and checks it matches what Studio ATS
 * sells (amount, currency, interval). A mismatch blocks checkout: selling at a
 * price the business did not configure is worse than not selling.
 */
async function stripePriceFor(offer: OfferRow): Promise<string> {
  const s = stripe();
  let price: Stripe.Price | null = offer.stripe_price_id ? await s.prices.retrieve(offer.stripe_price_id).catch(() => null) : null;
  if (!price && offer.stripe_lookup_key) {
    price = (await s.prices.list({ lookup_keys: [offer.stripe_lookup_key], active: true, limit: 1 })).data[0] ?? null;
    if (price) await supabaseService().from("offers").update({ stripe_price_id: price.id }).eq("id", offer.id);
  }
  if (!price || !price.active) {
    throw new CheckoutUnavailableError(`Stripe price not found (lookup key ${offer.stripe_lookup_key}); run npm run stripe:setup`);
  }
  const interval = price.recurring?.interval ?? "one_time";
  const ok = price.unit_amount === offer.price_cents
    && price.currency.toUpperCase() === offer.currency.toUpperCase()
    && interval === offer.billing_interval
    && (price.recurring?.interval_count ?? 1) === offer.interval_count;
  if (!ok) {
    log.error("payments", "Stripe price does not match the configured offer — checkout blocked", {
      offer_id: offer.id, stripe_price: price.id, stripe_amount: price.unit_amount, offer_amount: offer.price_cents,
    });
    throw new CheckoutUnavailableError("price mismatch");
  }
  return price.id;
}

/**
 * Creates a Stripe Checkout Session — server-side only. The attribution is
 * resolved here and stored on our own `checkout_sessions` row; Stripe metadata
 * only carries identifiers pointing back to it (plus a copy of the resolved ids
 * for support), and the webhook re-validates everything against that row.
 */
export async function createCheckoutSession(input: {
  locale: Locale;
  origin: CheckoutOrigin;
  sessionKey: string | null;
  privatePageSlug?: string | null;
  productSlug?: string;
  tier: OfferTier;
  promoCode?: string | null;
}): Promise<{ url: string }> {
  const sb = supabaseService();
  const { data: enabled } = await sb.from("settings").select("value").eq("key", "checkout.enabled").maybeSingle();
  if (enabled && enabled.value === false) throw new CheckoutUnavailableError("checkout disabled");

  const offer = await activeOffer(input.productSlug ?? "studio", input.tier);
  const [priceId, resolved] = await Promise.all([
    stripePriceFor(offer),
    resolveCheckoutAttribution({ sessionKey: input.sessionKey, privatePageSlug: input.privatePageSlug, code: input.promoCode ?? null }),
  ]);
  const { attribution, promo } = resolved;
  if (resolved.code === "invalid") throw new CheckoutUnavailableError("code does not match attribution");
  const promoDiscountCents = promo ? discountCents(offer.price_cents, promo.discountRate) : 0;

  const { data: row, error } = await sb.from("checkout_sessions").insert({
    origin: input.privatePageSlug && attribution.source === "private_page" ? "private_page" : input.origin,
    offer_id: offer.id, product_id: offer.product_id,
    affiliate_id: attribution.affiliateId, referral_session_id: attribution.referralSessionId,
    attribution_source: attribution.source, link_id: attribution.linkId, campaign_id: attribution.campaignId,
    private_page_id: attribution.privatePageId, session_key: input.sessionKey, locale: input.locale,
    promo_code_id: promo?.id ?? null, catalog_amount_cents: offer.price_cents,
    discount_amount_cents: promoDiscountCents, discount_rate: promo?.discountRate ?? 0,
    livemode: stripeMode() === "live",
  }).select("id").single();
  if (error || !row) throw new Error(`checkout row: ${error?.message}`);

  const metadata: Record<string, string> = {
    [CHECKOUT_METADATA_KEY]: row.id,
    product_id: offer.product_id,
    offer_id: offer.id,
    ...(attribution.affiliateId ? { affiliate_id: attribution.affiliateId } : {}),
    ...(attribution.referralSessionId ? { referral_id: attribution.referralSessionId } : {}),
    ...(attribution.campaignId ? { campaign_id: attribution.campaignId } : {}),
    ...(promo ? { promo_code_id: promo.id, promo_code: promo.code } : {}),
  };
  const recurring = offer.price_type === "recurring";
  const coupon = promo && promoDiscountCents > 0 ? await stripe().coupons.create({
    percent_off: promo.discountRate * 100,
    duration: "once",
    name: `${promo.code} — affiliate-funded`,
    metadata: { promo_code_id: promo.id, affiliate_id: promo.affiliateId, checkout_id: row.id },
  }, { idempotencyKey: `checkout-coupon:${row.id}` }) : null;

  const session = await stripe().checkout.sessions.create({
    mode: recurring ? "subscription" : "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    ...(coupon ? { discounts: [{ coupon: coupon.id }] } : {}),
    client_reference_id: row.id,
    metadata,
    ...(recurring
      ? { subscription_data: { metadata } }
      : { invoice_creation: { enabled: true, invoice_data: { metadata } }, customer_creation: "always" as const }),
    billing_address_collection: "required",
    locale: checkoutLocale(input.locale),
    success_url: `${env.siteUrl}/${input.locale}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.siteUrl}/${input.locale}/buy?offer=${input.tier}&cancelled=1${input.promoCode ? `&promo=${encodeURIComponent(input.promoCode)}` : ""}`,
  }, { idempotencyKey: `checkout:${row.id}` });

  await sb.from("checkout_sessions").update({
    stripe_checkout_session_id: session.id, status: "open",
    stripe_coupon_id: coupon?.id ?? null,
    expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
  }).eq("id", row.id);

  if (attribution.affiliateId) {
    await sb.from("activity_events").insert({ affiliate_id: attribution.affiliateId, type: "checkout_started", payload: {} });
  }
  log.info("payments", "checkout session created", {
    checkout_id: row.id, attribution: attribution.source, attributed: !!attribution.affiliateId,
  });
  if (!session.url) throw new Error("Stripe returned no checkout URL");
  return { url: session.url };
}

/** Checkout for a doubly accepted dossier. The immutable offer snapshot is the
 * source of truth; Stripe is re-read and must match it byte-for-byte. */
export async function createDossierCheckoutSession(dossierId: string): Promise<{ url: string }> {
  const sb = supabaseService();
  const { data: dossier } = await sb.from("commercial_dossiers")
    .select("id,public_ref,affiliate_id,client_email,locale,status,offer_id,offer_snapshot,offers!inner(product_id)")
    .eq("id", dossierId).maybeSingle();
  if (!dossier || dossier.status !== "awaiting_payment" || !dossier.offer_snapshot || !dossier.offer_id) {
    throw new CheckoutUnavailableError("dossier is not ready for payment");
  }
  const snapshot = dossier.offer_snapshot as {
    priceCents: number; currency: string; interval: "month" | "year" | "one_time";
    stripePriceId: string; totalCents: number; discountRate?: number; promoCode?: string | null;
  };
  const price = await stripe().prices.retrieve(snapshot.stripePriceId);
  const stripeInterval = price.recurring?.interval ?? "one_time";
  if (!price.active || price.unit_amount !== snapshot.priceCents || price.currency.toUpperCase() !== snapshot.currency.toUpperCase() || stripeInterval !== snapshot.interval) {
    throw new CheckoutUnavailableError("locked dossier price no longer matches Stripe");
  }
  const { data: row, error } = await sb.from("checkout_sessions").insert({
    dossier_id: dossier.id, origin: "dashboard_cta", offer_id: dossier.offer_id,
    product_id: (dossier.offers as unknown as { product_id: string }).product_id,
    affiliate_id: dossier.affiliate_id, attribution_source: "manual", locale: dossier.locale,
    catalog_amount_cents: snapshot.priceCents,
    discount_amount_cents: snapshot.priceCents - snapshot.totalCents,
    discount_rate: snapshot.discountRate ?? 0, livemode: stripeMode() === "live",
  }).select("id").single();
  if (error || !row) throw new Error(`dossier checkout row: ${error?.message}`);
  const metadata = { [CHECKOUT_METADATA_KEY]: row.id, dossier_id: dossier.id, offer_id: dossier.offer_id };
  const coupon = snapshot.totalCents < snapshot.priceCents ? await stripe().coupons.create({
    amount_off: snapshot.priceCents - snapshot.totalCents, currency: snapshot.currency.toLowerCase(), duration: "once",
    name: snapshot.promoCode ?? `Dossier ${dossier.public_ref}`, metadata: { dossier_id: dossier.id, studio_checkout_id: row.id },
  }, { idempotencyKey: `dossier-coupon:${dossier.id}:${snapshot.totalCents}` }) : null;
  const session = await stripe().checkout.sessions.create({
    mode: snapshot.interval === "one_time" ? "payment" : "subscription",
    line_items: [{ price: snapshot.stripePriceId, quantity: 1 }], customer_email: dossier.client_email,
    ...(coupon ? { discounts: [{ coupon: coupon.id }] } : {}),
    client_reference_id: row.id, metadata,
    ...(snapshot.interval === "one_time"
      ? { invoice_creation: { enabled: true, invoice_data: { metadata } }, customer_creation: "always" as const }
      : { subscription_data: { metadata } }),
    billing_address_collection: "required", locale: checkoutLocale(dossier.locale as Locale),
    success_url: `${env.siteUrl}/${dossier.locale}/dossier/${dossier.public_ref}?payment=success`,
    cancel_url: `${env.siteUrl}/${dossier.locale}/dossier/${dossier.public_ref}?payment=cancelled`,
  }, { idempotencyKey: `dossier-checkout:${dossier.id}:${snapshot.totalCents}` });
  if (!session.url) throw new Error("Stripe returned no checkout URL");
  await sb.from("checkout_sessions").update({ stripe_checkout_session_id: session.id, status: "open", stripe_coupon_id: coupon?.id ?? null, expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null }).eq("id", row.id);
  await sb.from("commercial_dossiers").update({ checkout_session_id: row.id, stripe_checkout_session_id: session.id, stripe_checkout_url: session.url }).eq("id", dossier.id).eq("status", "awaiting_payment");
  return { url: session.url };
}

/** Read-only status for the /success page. Never creates anything. */
export async function checkoutStatus(stripeSessionId: string): Promise<"confirmed" | "processing" | "expired" | "unknown"> {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(stripeSessionId)) return "unknown";
  const sb = supabaseService();
  const { data: ch } = await sb.from("checkout_sessions")
    .select("id, status, stripe_subscription_id").eq("stripe_checkout_session_id", stripeSessionId).maybeSingle();
  if (!ch) return "unknown";
  if (ch.status === "expired") return "expired";
  // Confirmed = a sale exists for this purchase, i.e. Stripe's paid invoice was processed.
  let saleQuery = sb.from("sales").select("id", { count: "exact", head: true }).in("status", ["paid", "partially_refunded"]);
  if (ch.stripe_subscription_id) {
    const { data: sub } = await sb.from("subscriptions").select("id").eq("stripe_subscription_id", ch.stripe_subscription_id).maybeSingle();
    if (!sub) return "processing";
    saleQuery = saleQuery.eq("subscription_id", sub.id);
  } else {
    saleQuery = saleQuery.eq("checkout_session_id", ch.id);
  }
  const { count } = await saleQuery;
  return (count ?? 0) > 0 ? "confirmed" : "processing";
}
