import { getDictionary } from "@/i18n";
import { localeMeta, type Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { defaultSalesAssets } from "@/content/sales-kit";
import { PageHeader, Card, Badge, Notice } from "@/components/ui/primitives";

/** V0: read-only view of the seeded sales kit. Editing + file uploads (Supabase Storage) come next. */
export default async function AdminContent({ params }: PageProps<"/[locale]/admin/content">) {
  const { locale } = (await params) as { locale: Locale };
  await requireStaff(locale);
  const t = await getDictionary(locale);
  return (
    <>
      <PageHeader title={t.admin.nav.content} />
      <div className="mb-4"><Notice>{t.admin.contentNotice}</Notice></div>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-line">
          {defaultSalesAssets.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
              <Badge tone="accent">{t.dash.salesKit.sections[a.type]}</Badge>
              <Badge>{localeMeta[a.locale].label}</Badge>
              <span className="truncate text-[14px]">{a.title}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
