import { Check, TriangleAlert } from "lucide-react";
import { ProductShowcaseGallery } from "@/components/marketing/product-showcase-gallery";
import { Badge, Notice, PageHeader } from "@/components/ui/primitives";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { ofKind, salesContext } from "@/lib/sales/server";

export default async function Product({ params }: PageProps<"/[locale]/dashboard/sales-center/product">) {
  const { locale } = (await params) as { locale: Locale };
  const session = await requireAffiliate(locale);
  const [t, context] = await Promise.all([getDictionary(locale), salesContext(session, locale)]);
  const knowledge = ofKind(context.content, "knowledge");

  return (
    <div className="space-y-6">
      <PageHeader title={t.sc.product.title} subtitle={t.sc.product.subtitle} />
      <Notice tone="warning"><TriangleAlert className="size-4" />{t.sc.product.rule}</Notice>

      <section>
        <h2 className="mb-3 font-semibold">{t.sc.product.offers}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {context.products.map((product) => (
            <div key={product.id} className="card p-5">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{product.name}</h3>
                <Badge tone={product.active ? "success" : "neutral"}>
                  {product.active ? t.sc.product.officialPrice : t.sc.product.inactive}
                </Badge>
              </div>
              <p className="mt-3 text-[24px] font-semibold">
                {product.offer
                  ? `${formatMoney(product.offer.priceCents, locale, product.offer.currency)} ${t.sc.product.perInterval[product.offer.interval]}`
                  : t.sc.product.onRequest}
              </p>
              <p className="mt-1 text-[12px] text-muted">{t.sc.product.priceSource}</p>
            </div>
          ))}
        </div>
      </section>

      <ProductShowcaseGallery t={t} compact />

      <div className="grid gap-4">
        {knowledge.map((item) => (
          <section key={item.id} id={item.key} className="card p-5">
            <h2 className="text-[18px] font-semibold">{t.sc.product.sections[item.body.section]}</h2>
            {item.summary && <p className="mt-1 text-[14px] text-muted">{item.summary}</p>}
            <ul className="mt-4 grid gap-3">
              {item.body.items.map((entry, index) => (
                <li key={`${entry.title}-${index}`} className="rounded-xl bg-surface-2 p-4">
                  <div className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    <div>
                      <strong className="text-[14px]">{entry.title}</strong>
                      <p className="mt-1 text-[14px] text-fg-2">{entry.body}</p>
                      {entry.availability && <Badge className="mt-2">{t.sc.product.availability[entry.availability]}</Badge>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
