/**
 * Creates (idempotently) the three Studio ATS products and their prices
 * (Studio One €500 one-time, Studio Pro €3,000/year, Studio Premium €6,000/year)
 * in the Stripe account of STRIPE_SECRET_KEY, with the lookup keys the database
 * uses (offers.stripe_lookup_key). Test mode by default:
 *
 *   STRIPE_SECRET_KEY=sk_test_… node scripts/stripe-setup.ts
 *
 * Price ids are resolved at checkout via the lookup key, so there is nothing
 * to copy into the database. Refuses live keys unless --live is passed.
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY ?? "";
if (!/^(sk|rk)_(test|live)_/.test(key)) {
  console.error("STRIPE_SECRET_KEY is missing.");
  process.exit(1);
}
if (key.includes("_live_") && !process.argv.includes("--live")) {
  console.error("Refusing to create objects with a LIVE key. Re-run with --live if this is intended.");
  process.exit(1);
}

const stripe = new Stripe(key);

// Must equal public.offers (price_cents, interval) — checkout refuses a mismatch.
// See supabase/migrations/20260928000001_offers_v3.sql.
const OFFERS = [
  { lookupKey: "studio_one_eur", name: "Studio One", description: "Your professional digital presence, delivered with no Studio subscription.", amount: 50_000, interval: null },
  { lookupKey: "studio_pro_yearly_eur", name: "Studio Pro", description: "A more complete digital presence, maintained throughout the year by Studio.", amount: 300_000, interval: "year" },
  { lookupKey: "studio_yearly_eur", name: "Studio Premium", description: "A complete digital commercial ecosystem operated and supported by Studio.", amount: 600_000, interval: "year" },
] as const;

// A distinct Stripe product makes the exact offer name visible from Checkout to
// invoices and receipts. Old prices/subscriptions are never edited or migrated.
const anyExisting = (await stripe.prices.list({ lookup_keys: OFFERS.map((o) => o.lookupKey), active: true, expand: ["data.product"] })).data;

for (const o of OFFERS) {
  const existing = anyExisting.find((p) => p.lookup_key === o.lookupKey);
  const interval = existing?.recurring?.interval ?? null;
  const existingProduct = existing?.product as Stripe.Product | undefined;
  if (existing && existing.unit_amount === o.amount && interval === o.interval && existingProduct?.name === o.name) {
    await stripe.products.update(existingProduct.id, {
      name: o.name, description: o.description,
      metadata: { studio_product: "studio", studio_offer: o.lookupKey },
    });
    await stripe.prices.update(existing.id, { nickname: o.name, metadata: { studio_offer: o.lookupKey } });
    console.log(`${o.name}: price already exists: ${existing.id} (${existing.unit_amount} ${existing.currency}/${interval ?? "one-time"}) — nothing to do.`);
    continue;
  }
  const product = await stripe.products.create(
    { name: o.name, description: o.description, metadata: { studio_product: "studio", studio_offer: o.lookupKey } },
    { idempotencyKey: `studio-setup-product-${o.lookupKey}-v2` },
  );
  // Stripe prices are immutable: a price change is a new price that takes over the
  // lookup key. Existing subscriptions keep their old price and product untouched.
  const price = await stripe.prices.create(
    {
      product: product.id, currency: "eur", unit_amount: o.amount,
      ...(o.interval ? { recurring: { interval: o.interval, interval_count: 1 } } : {}),
      nickname: o.name, lookup_key: o.lookupKey, transfer_lookup_key: true, tax_behavior: "unspecified",
      metadata: { studio_offer: o.lookupKey },
    },
    { idempotencyKey: `studio-setup-price-${o.lookupKey}-${o.amount}-${o.interval ?? "once"}` },
  );
  if (existing) await stripe.prices.update(existing.id, { active: false });
  console.log(`${o.name}: ${existing ? "replaced" : "created"} price ${price.id} on product ${product.id} (lookup key ${o.lookupKey}).`);
}
