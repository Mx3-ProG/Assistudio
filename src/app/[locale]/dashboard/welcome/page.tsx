import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { env } from "@/lib/env";
import { computeCommissionCents } from "@/lib/commission";
import { Onboarding } from "@/components/dashboard/onboarding";

/** First run: product → market → link → message → prospect, in under 5 minutes. */
export default async function Welcome({ params }: PageProps<"/[locale]/dashboard/welcome">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const [markets, offer] = await Promise.all([repo().listMarkets(), repo().getOffer()]);
  return (
    <div className="py-4 sm:py-10">
      <Onboarding
        markets={markets}
        link={`${env.siteUrl}/s/${s.affiliate.slug ?? s.affiliate.code}`}
        priceCents={offer.priceCents}
        commissionCents={computeCommissionCents(offer.priceCents, s.affiliate.commissionRate)}
        startStep={s.affiliate.onboardingCompletedAt ? 0 : s.affiliate.onboardingStep}
        pending={s.affiliate.status !== "approved"}
      />
    </div>
  );
}
