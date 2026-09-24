import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { Navbar } from "@/components/marketing/navbar";
import { PaymentStatus } from "@/components/marketing/payment-status";

export async function generateMetadata({ params }: PageProps<"/[locale]/success">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return { title: `${t.success.welcomeTitle.replace(/\.$/, "")}`, robots: { index: false, follow: false } };
}

/**
 * Stripe redirects here after Checkout. This page NEVER records anything:
 * a redirect is not a proof of payment. It only reads the server state, which
 * the signed webhook updates, and waits for it.
 */
export default async function SuccessPage({ params, searchParams }: PageProps<"/[locale]/success">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const t = await getDictionary(locale);
  const sessionId = typeof sp.session_id === "string" ? sp.session_id : "";
  return (
    <>
      <Navbar variant="studio" />
      <main className="mx-auto max-w-xl px-4 pb-24 pt-20 text-center sm:px-6 sm:pt-28">
        <PaymentStatus sessionId={sessionId} locale={locale} text={t.success} />
      </main>
    </>
  );
}
