import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireSession } from "@/lib/auth";
import { getDossierForUser } from "@/lib/contracts/service";
import { affiliateReviewAction } from "@/app/actions/contracts";
import { DOSSIER_STATUS_LABELS, briefSections, fieldLabel } from "@/content/contracts";
import { PageHeader, Badge, Field, textareaClass, inputClass } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function AffiliateDossierPage({ params }: PageProps<"/[locale]/dashboard/documents/[id]">) {
  const { locale, id } = await params as { locale: Locale; id: string }; const s = await requireSession(locale); const d = await getDossierForUser(s, id); if (!d) notFound(); const fr = locale === "fr";
  return <div className="space-y-6"><PageHeader title={d.clientCompany || d.clientName || d.clientEmail} subtitle={d.ref} action={<Badge>{DOSSIER_STATUS_LABELS[locale][d.status]}</Badge>} />
    {d.currentRevision > 0 && <div className="grid gap-4">{briefSections(locale).map((section) => <section key={section.id} className="card p-5"><h2 className="font-semibold">{section.title}</h2><dl className="mt-3 grid gap-3 sm:grid-cols-2">{section.fields.map((field) => d.answers[field.key] ? <div key={field.key}><dt className="text-xs text-muted">{fieldLabel(field, locale)}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{Array.isArray(d.answers[field.key]) ? (d.answers[field.key] as unknown[]).join(", ") : String(d.answers[field.key])}</dd></div> : null)}</dl></section>)}</div>}
    {d.status === "affiliate_review" && <section className="card p-5"><h2 className="font-semibold">{fr ? "Votre relecture" : "Your review"}</h2><form action={affiliateReviewAction} className="mt-4 grid gap-4"><input type="hidden" name="id" value={d.id} /><Field label={fr ? "Recommandation" : "Recommendation"}><select name="tier" defaultValue="pro" className={inputClass}><option value="one">Studio One</option><option value="pro">Studio Pro</option><option value="premium">Studio Premium</option></select></Field><Field label={fr ? "Commentaire" : "Comment"}><textarea name="note" required minLength={3} className={textareaClass} /></Field><div className="flex flex-wrap gap-2"><Button name="action" value="submit">{fr ? "Transmettre à l’admin" : "Send to admin"}</Button><Button name="action" value="changes" variant="secondary">{fr ? "Demander des corrections" : "Request changes"}</Button></div></form></section>}
    {!!d.documents.length && <section className="card p-5"><h2 className="font-semibold">{fr ? "Documents verrouillés" : "Locked documents"}</h2><div className="mt-3 flex flex-wrap gap-2">{d.documents.map((doc) => <a key={doc.id} className="rounded-full border border-line px-4 py-2 text-sm" href={`/api/dossier-documents/${doc.id}`}>{doc.kind} · SHA {doc.sha256.slice(0, 10)}…</a>)}</div></section>}
  </div>;
}
