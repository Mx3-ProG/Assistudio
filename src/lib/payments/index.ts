/**
 * Payment-provider contract (V0: not wired to a provider yet).
 *
 * A provider adapter turns its webhook payload into one of these normalised
 * events. The webhook route then applies them idempotently
 * (sales.provider_payment_id is UNIQUE), and the database trigger
 * `sales_commission_lifecycle` moves the commission accordingly.
 *
 * Choose a provider (e.g. Stripe Billing for customers, and a payout rail such
 * as Stripe Connect / Wise for affiliates) and implement `PaymentProvider`.
 */
export type PaymentEvent =
  | { type: "payment.succeeded"; providerPaymentId: string; providerCustomerId: string; amountCents: number; currency: string; subscriptionRef?: string; periodStart?: string; periodEnd?: string }
  | { type: "payment.failed"; providerPaymentId: string }
  | { type: "payment.refunded"; providerPaymentId: string }
  | { type: "payment.chargeback"; providerPaymentId: string }
  | { type: "subscription.cancelled"; subscriptionRef: string; at: string }
  | { type: "subscription.renewal_upcoming"; subscriptionRef: string; at: string };

export interface PaymentProvider {
  name: string;
  /** Verify the signature and parse. Must throw on invalid signatures. */
  parseWebhook(rawBody: string, headers: Headers): Promise<PaymentEvent[]>;
}

export function getPaymentProvider(): PaymentProvider | null {
  return null; // No provider configured in V0.
}
