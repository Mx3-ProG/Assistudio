import Link from "next/link";
import { FileSignature } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { requireSession } from "@/lib/auth";
import { listAffiliateDossiers } from "@/lib/contracts/service";
import { DOSSIER_STATUS_LABELS } from "@/content/contracts";
import { createDossierAction } from "@/app/actions/contracts";
import { repo } from "@/lib/data";
import { PageHeader, Badge, EmptyState, Field, inputClass } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function DocumentsPage({ params }: PageProps<"/[locale]/dashboard/documents">) {
  const { locale } = await params as { locale: Locale }; const session = await requireSession(locale);
  const [dossiers, prospects] = await Promise.all([listAffiliateDossiers(session), repo().listProspects(session)]); const fr = locale === "fr";
  return <div className="space-y-6">
    <PageHeader title={fr ? "Documents & contrats" : "Documents & contracts"} subtitle={fr ? "Créez un dossier, relisez le cahier des charges et suivez l’acceptation." : "Create a dossier, review the brief and follow acceptance."} />
    <section className="card p-5 sm:p-6"><h2 className="font-semibold">{fr ? "Nouveau dossier client" : "New client dossier"}</h2>
      <form action={createDossierAction} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label={fr ? "Prospect existant" : "Existing prospect"}><select name="prospectId" className={inputClass}><option value="">—</option>{prospects.filter((p) => p.email).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.email}</option>)}</select></Field>
        <Field label={fr ? "Ou e-mail professionnel" : "Or business email"}><input name="email" type="email" className={inputClass} /></Field>
        <Field label={fr ? "Nom du contact" : "Contact name"}><input name="clientName" className={inputClass} /></Field>
        <Field label={fr ? "Langue du contrat" : "Contract language"}><select name="locale" defaultValue={locale} className={inputClass}>{["fr","en","de","es","pt","it","nl","ar"].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <div className="flex items-end"><Button className="w-full">{fr ? "Créer et inviter" : "Create and invite"}</Button></div>
      </form>
    </section>
    <section className="card p-5 sm:p-6"><h2 className="font-semibold">{fr ? "PDF imprimables de secours" : "Printable fallback PDFs"}</h2><p className="mt-1 text-sm text-muted">{fr ? "Toujours marqués « Brouillon — non contractuel ». L’acceptation numérique reste le parcours de référence." : "Always marked Draft — non-contractual. The digital acceptance flow remains authoritative."}</p><div className="mt-4 flex flex-wrap gap-2"><a className="rounded-full border border-line px-4 py-2 text-sm" href={`/api/dossier-templates/brief?locale=${locale}`}>{fr ? "Cahier vierge" : "Blank brief"}</a>{["one","pro","premium"].map((tier) => <a key={tier} className="rounded-full border border-line px-4 py-2 text-sm" href={`/api/dossier-templates/quote?locale=${locale}&tier=${tier}`}>Studio {tier}</a>)}</div></section>
    {dossiers.length ? <ul className="grid gap-3">{dossiers.map((d) => <li key={d.id}><Link href={`/${locale}/dashboard/documents/${d.id}`} className="card flex items-center gap-4 p-5 transition hover:border-accent/40">
      <div className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent"><FileSignature className="size-5" /></div>
      <div className="min-w-0 flex-1"><strong>{d.clientCompany || d.clientName || d.clientEmail}</strong><p className="mt-1 text-sm text-muted">{d.ref} · {d.clientEmail}</p></div>
      <Badge tone={d.status === "active" ? "success" : d.status.includes("review") ? "warning" : "neutral"}>{DOSSIER_STATUS_LABELS[locale][d.status]}</Badge>
    </Link></li>)}</ul> : <div className="card"><EmptyState icon={<FileSignature />} title={fr ? "Aucun dossier pour le moment." : "No dossier yet."} /></div>}
  </div>;
}
