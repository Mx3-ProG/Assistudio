import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { SalesCenterSubnav } from "@/components/sales-center/subnav";

export default async function SalesCenterLayout({ children, params }: LayoutProps<"/[locale]/dashboard/sales-center">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  const base = `/${locale}/dashboard/sales-center`;
  return <>
    <SalesCenterSubnav
      label={t.sc.title}
      items={[
        { key: "home", href: base, label: t.cp.nav.copilot },
        { key: "start", href: `${base}/start`, label: t.sc.startSelling },
        { key: "targets", href: `${base}/targets`, label: t.sc.targets.title },
        { key: "pages", href: `${base}/pages`, label: t.sc.pages.title },
        { key: "favorites", href: `${base}/favorites`, label: t.sc.favorites.title },
      ]}
    />
    {children}
  </>;
}
