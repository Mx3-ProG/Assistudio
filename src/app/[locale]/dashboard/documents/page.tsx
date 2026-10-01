import Link from "next/link";
import { FileSignature } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { requireSession } from "@/lib/auth";
import { listAffiliateDossiers } from "@/lib/contracts/service";
import { CONTRACT_LANGUAGES, contractsCopy, dossierStatusLabel } from "@/content/contracts";
import { createDossierAction } from "@/app/actions/contracts";
import { repo } from "@/lib/data";
import { PageHeader, Badge, EmptyState, Field, inputClass } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function DocumentsPage({ params }: PageProps<"/[locale]/dashboard/documents">) {
  const { locale } = await params as { locale: Locale }; const session = await requireSession(locale);
  const [dossiers, prospects] = await Promise.all([listAffiliateDossiers(session), repo().listProspects(session)]); const t = contractsCopy(locale).affiliate;
  return <div className="space-y-6">
    <PageHeader title={contractsCopy(locale).navAffiliate} subtitle={t.subtitle} />
    <section className="card p-5 sm:p-6"><h2 className="font-semibold">{t.newTitle}</h2>
      <form action={createDossierAction} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label={t.prospect}><select name="prospectId" className={inputClass}><option value="">—</option>{prospects.filter((p) => p.email).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.email}</option>)}</select></Field>
        <Field label={t.email}><input name="email" type="email" className={inputClass} /></Field>
        <Field label={t.contactName}><input name="clientName" className={inputClass} /></Field>
        <Field label={t.language}><select name="locale" defaultValue={locale} className={inputClass}>{CONTRACT_LANGUAGES.map((x) => <option key={x.code} value={x.code}>{x.label}</option>)}</select></Field>
        <div className="flex items-end"><Button className="w-full">{t.create}</Button></div>
      </form>
    </section>
    <section className="card p-5 sm:p-6"><h2 className="font-semibold">{t.fallbackTitle}</h2><p className="mt-1 text-sm text-muted">{t.fallbackBody}</p><div className="mt-4 flex flex-wrap gap-2"><a className="rounded-full border border-line px-4 py-2 text-sm" href={`/api/dossier-templates/brief?locale=${locale}`}>{t.blankBrief}</a>{["one","pro","premium"].map((tier) => <a key={tier} className="rounded-full border border-line px-4 py-2 text-sm" href={`/api/dossier-templates/quote?locale=${locale}&tier=${tier}`}>Studio {tier[0].toUpperCase() + tier.slice(1)}</a>)}</div></section>
    {dossiers.length ? <ul className="grid gap-3">{dossiers.map((d) => <li key={d.id}><Link href={`/${locale}/dashboard/documents/${d.id}`} className="card flex items-center gap-4 p-5 transition hover:border-accent/40">
      <div className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent"><FileSignature className="size-5" /></div>
      <div className="min-w-0 flex-1"><strong>{d.clientCompany || d.clientName || d.clientEmail}</strong><p className="mt-1 text-sm text-muted">{d.ref} · {d.clientEmail}</p></div>
      <Badge tone={d.status === "active" ? "success" : d.status.includes("review") ? "warning" : "neutral"}>{dossierStatusLabel(d.status, locale)}</Badge>
    </Link></li>)}</ul> : <div className="card"><EmptyState icon={<FileSignature />} title={t.empty} /></div>}
  </div>;
}
