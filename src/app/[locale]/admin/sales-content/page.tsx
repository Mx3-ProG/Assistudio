import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { PageHeader, Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { SalesContentEditor } from "@/components/admin/sales-content-editor";
import { salesContentAction } from "@/app/actions/admin-sales-center";

export default async function SalesContentAdmin({ params }: PageProps<"/[locale]/admin/sales-content">) {
  const { locale } = (await params) as { locale: Locale };
  const staff = await requireStaff(locale);
  const [t, contentItems] = await Promise.all([getDictionary(locale), repo().adminListSalesContent(staff)]);
  const A = t.sc.admin;

  return (
    <div className="space-y-6">
      <PageHeader title={A.title} subtitle={A.subtitle} />
      <SalesContentEditor />
      <div className="card overflow-hidden">
        <ul className="divide-y divide-line">
          {contentItems.map((item) => (
            <li key={item.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="min-w-0 flex-1 truncate">{item.title}</strong>
                <Badge>{item.kind}</Badge><Badge>{item.locale}</Badge>
                <Badge tone={item.status === "active" ? "success" : item.status === "draft" ? "warning" : "neutral"}>{A.status[item.status]}</Badge>
              </div>
              <p className="mt-1 font-mono text-[11px] text-muted">{item.key} · v{item.version}</p>
              {item.summary && <p className="mt-2 text-[13px] text-fg-2">{item.summary}</p>}
              <details className="mt-3">
                <summary className="cursor-pointer text-[13px] text-accent">JSON / actions</summary>
                <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-surface-2 p-3 text-[11px]">{JSON.stringify(item.body, null, 2)}</pre>
                {item.status === "draft" && <div className="mt-3"><SalesContentEditor content={item} /></div>}
                <form action={salesContentAction} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <input name="reason" placeholder={A.reason} className="h-9 min-w-52 rounded-xl border border-line bg-surface px-3 text-[13px]" />
                  {item.status === "draft" && <button name="op" value="publish" className={buttonClass("accent", "sm")}>{A.publish}</button>}
                  {item.status === "active" && <>
                    <button name="op" value="version" className={buttonClass("secondary", "sm")}>{A.newVersion}</button>
                    <button name="op" value="archive" className={buttonClass("ghost", "sm")}>{A.archive}</button>
                  </>}
                  {item.status === "draft" && <button name="op" value="delete" className={buttonClass("ghost", "sm")}>{A.delete}</button>}
                </form>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
