import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { pageMetadata, JsonLd } from "@/lib/seo";
import { InfoPage } from "@/components/marketing/info-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/faq">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return pageMetadata(locale, "/faq", `${t.pages.faq.title} — STUDIO`, t.pages.faq.items[0].a);
}

export default async function Faq({ params }: PageProps<"/[locale]/faq">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  const items = [...t.pages.faq.items, ...t.studio.faq];
  return (
    <InfoPage title={t.pages.faq.title}>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <div className="mt-10 divide-y divide-line border-y border-line">
        {items.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium">
              {f.q}
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-8 text-[12px] leading-relaxed text-muted">{t.common.illustrationOnly}</p>
    </InfoPage>
  );
}
