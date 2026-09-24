/**
 * Creates (idempotently) the STUDIO product and its yearly €6,000 price in the
 * Stripe account of STRIPE_SECRET_KEY, with the lookup key the database uses
 * (offers.stripe_lookup_key = 'studio_yearly_eur'). Test mode by default:
 *
 *   STRIPE_SECRET_KEY=sk_test_… node scripts/stripe-setup.ts
 *
 * The price id is resolved at checkout via the lookup key, so there is nothing
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

const LOOKUP_KEY = "studio_yearly_eur";
const stripe = new Stripe(key);

const AMOUNT = 600_000; // must equal offers.price_cents — checkout refuses a mismatch

const existing = (await stripe.prices.list({ lookup_keys: [LOOKUP_KEY], active: true, expand: ["data.product"] })).data[0];
if (existing && existing.unit_amount === AMOUNT) {
  console.log(`Price already exists: ${existing.id} (${existing.unit_amount} ${existing.currency}/${existing.recurring?.interval}) — nothing to do.`);
  process.exit(0);
}

// Stripe prices are immutable: a price change is a new price that takes over the
// lookup key. Existing subscriptions keep their old price until migrated.
const product = existing
  ? (existing.product as Stripe.Product)
  : await stripe.products.create(
    { name: "STUDIO", description: "STUDIO — annual subscription", metadata: { studio_product: "studio" } },
    { idempotencyKey: "studio-setup-product-v1" },
  );
const price = await stripe.prices.create(
  {
    product: product.id, currency: "eur", unit_amount: AMOUNT, recurring: { interval: "year", interval_count: 1 },
    lookup_key: LOOKUP_KEY, transfer_lookup_key: true, tax_behavior: "unspecified", metadata: { studio_offer: "studio_yearly_eur" },
  },
  { idempotencyKey: `studio-setup-price-${AMOUNT}` },
);
if (existing) await stripe.prices.update(existing.id, { active: false });
console.log(`${existing ? "Replaced" : "Created"} price ${price.id} on product ${product.id} (lookup key ${LOOKUP_KEY}).`);
