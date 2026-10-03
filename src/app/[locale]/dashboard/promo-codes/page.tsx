import { Tag } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { fmt } from "@/i18n/format";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { env } from "@/lib/env";
import { formatDate, formatPercent } from "@/lib/money";
import { PageHeader, Card, EmptyState, Badge, Notice } from "@/components/ui/primitives";
import { CopyButton } from "@/components/ui/copy-button";
import { PromoCodeForm } from "@/components/dashboard/promo-code-form";
import { setPromoCodeActive } from "@/app/actions/dashboard";
import { buttonClass } from "@/components/ui/button";

export default async function PromoCodesPage({ params }: PageProps<"/[locale]/dashboard/promo-codes">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const [t, codes, defaultLink] = await Promise.all([getDictionary(locale), repo().listPromoCodes(s), repo().getDefaultLink(s)]);
  const P = t.dash.promoCodes;
  const trackedUrl = (code: string) => `${env.siteUrl}/s/${defaultLink.code}?to=${encodeURIComponent(`/${locale}/pricing?promo=${code}`)}`;
  return <>
    <PageHeader title={P.title} subtitle={P.subtitle} />
    <PromoCodeForm commissionRate={s.affiliate.commissionRate} approved={s.affiliate.status === "approved"} />
    <div className="mt-4"><Notice>{P.rule}</Notice></div>
    <h2 className="mb-3 mt-8 text-[15px] font-semibold">{P.listTitle}</h2>
    <Card className="overflow-hidden">
      {codes.length === 0 ? <EmptyState icon={<Tag className="size-5" />} title={P.empty} /> :
        <ul className="divide-y divide-line">{codes.map((code) => <li key={code.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[16px] font-semibold">{code.code}</span><Badge tone={code.active ? "success" : "neutral"}>{code.active ? P.active : P.inactive}</Badge></div>
            <p className="mt-1 text-[13px] text-muted">{formatPercent(code.discountRate, locale, 0)} · {fmt(P.margin, { rate: formatPercent(Math.max(0, s.affiliate.commissionRate - code.discountRate), locale, 0) })} · {fmt(P.uses, { count: code.redemptions })} · {formatDate(code.createdAt, locale, "short")}</p>
          </div>
          <div className="flex items-center gap-2">
            {code.active && <CopyButton track="affiliate_link_copied" value={trackedUrl(code.code)} />}
            <form action={setPromoCodeActive}><input type="hidden" name="id" value={code.id} /><input type="hidden" name="active" value={String(!code.active)} /><button className={buttonClass("secondary", "sm")}>{code.active ? P.disable : P.enable}</button></form>
          </div>
        </li>)}</ul>}
    </Card>
  </>;
}
