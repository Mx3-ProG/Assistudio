import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { listAdminDossiers } from "@/lib/contracts/service";
import { contractsCopy, dossierStatusLabel } from "@/content/contracts";
import { PageHeader, Badge, EmptyState } from "@/components/ui/primitives";

export default async function ContractsAdminPage({ params }: PageProps<"/[locale]/admin/contracts">) {
  const { locale } = await params as { locale: Locale }; const s = await requireStaff(locale); const dossiers = await listAdminDossiers(s); const t = contractsCopy(locale);
  return <div><PageHeader title={t.navAdmin} subtitle={t.admin.subtitle} />
    {dossiers.length ? <ul className="grid gap-3">{dossiers.map((d) => <li key={d.id}><Link href={`/${locale}/admin/contracts/${d.id}`} className="card flex items-center gap-3 p-5"><div className="min-w-0 flex-1"><strong>{d.clientCompany || d.clientName || d.clientEmail}</strong><p className="text-sm text-muted">{d.ref} · {d.recommendedTier ?? "—"}</p></div><Badge tone={d.status === "admin_review" || d.status === "awaiting_studio_acceptance" ? "warning" : d.status === "active" ? "success" : "neutral"}>{dossierStatusLabel(d.status, locale)}</Badge></Link></li>)}</ul> : <div className="card"><EmptyState title={t.admin.empty} /></div>}
  </div>;
}
