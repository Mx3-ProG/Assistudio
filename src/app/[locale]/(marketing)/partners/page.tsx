import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { InfoPage } from "@/components/marketing/info-page";
import { LinkButton } from "@/components/ui/button";

export async function generateMetadata({ params }: PageProps<"/[locale]/partners">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return pageMetadata(locale, "/partners", `${t.pages.partners.title} — STUDIO`, t.pages.partners.body);
}

export default async function Partners({ params }: PageProps<"/[locale]/partners">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  const steps = [t.home.steps.share, t.home.steps.sell, t.home.steps.earn];
  return (
    <InfoPage title={t.pages.partners.title} body={t.pages.partners.body}>
      <ol className="mt-10 grid gap-3">
        {steps.map((s, i) => (
          <li key={s.title} className="card flex gap-5 p-6">
            <span className="tabular text-[13px] font-semibold text-accent">0{i + 1}</span>
            <div>
              <p className="text-[18px] font-semibold">{s.title}</p>
              <p className="mt-1 text-[15px] text-muted">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex flex-wrap gap-3">
        <LinkButton href={`/${locale}/register`} variant="accent" size="lg">{t.nav.becomePartner}</LinkButton>
        <LinkButton href={`/${locale}/affiliate-terms`} variant="secondary" size="lg">{t.footer.affiliateTerms}</LinkButton>
      </div>
      <p className="mt-8 text-[12px] leading-relaxed text-muted">{t.common.illustrationOnly}</p>
    </InfoPage>
  );
}
