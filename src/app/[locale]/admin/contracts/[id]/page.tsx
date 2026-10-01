import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { getDossierForUser, getStudioLegalIdentity } from "@/lib/contracts/service";
import { countersignDossierAction, lockDossierAction, regenerateDossierCheckoutAction, requestAdminChangesAction } from "@/app/actions/contracts";
import { contractsCopy, documentKindLabel, dossierStatusLabel } from "@/content/contracts";
import { PageHeader, Badge, Field, inputClass, textareaClass, Notice } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function AdminContractPage({ params }: PageProps<"/[locale]/admin/contracts/[id]">) {
  const { locale, id } = await params as { locale: Locale; id: string }; const s = await requireStaff(locale); const [d, legal] = await Promise.all([getDossierForUser(s, id), getStudioLegalIdentity(s)]); if (!d) notFound(); const t = contractsCopy(locale);
  return <div className="space-y-6"><PageHeader title={d.clientCompany || d.clientName || d.clientEmail} subtitle={`${d.ref} · ${d.clientEmail}`} action={<Badge>{dossierStatusLabel(d.status, locale)}</Badge>} />
    <section className="grid gap-4 sm:grid-cols-3"><div className="card p-5"><p className="text-xs text-muted">{t.admin.recommendation}</p><strong className="mt-2 block">Studio {d.recommendedTier ?? "—"}</strong></div><div className="card p-5"><p className="text-xs text-muted">{t.admin.revision}</p><strong className="mt-2 block">#{d.currentRevision}</strong></div><div className="card p-5"><p className="text-xs text-muted">Manifest SHA-256</p><strong className="mt-2 block truncate font-mono text-xs">{d.manifestSha256 ?? "—"}</strong></div></section>
    {d.affiliateNote && <Notice>{d.affiliateNote}</Notice>}
    {d.status === "admin_review" && <section className="card p-5 sm:p-6"><h2 className="font-semibold">{t.admin.lockTitle}</h2><Notice tone="warning">{t.admin.lockWarning}</Notice>
      <form action={lockDossierAction} className="mt-5 grid gap-4 sm:grid-cols-2"><input type="hidden" name="id" value={d.id} />
        <Field label={t.admin.offer}><select name="tier" defaultValue={d.recommendedTier ?? "pro"} className={inputClass}><option value="one">Studio One</option><option value="pro">Studio Pro</option><option value="premium">Studio Premium</option></select></Field>
        <Field label={t.admin.validity}><input name="validDays" type="number" defaultValue="30" min="1" max="180" className={inputClass} /></Field>
        <Field label={t.admin.promo}><input name="promoCode" className={inputClass} /></Field><div />
        <Field className="sm:col-span-2" label={t.admin.scope}><textarea name="scope" required minLength={10} className={textareaClass} /></Field>
        <Field label={t.admin.legalName}><input name="legalName" required defaultValue={legal.legalName} className={inputClass} /></Field>
        <Field label={t.admin.representative}><input name="representative" required defaultValue={legal.representative} className={inputClass} /></Field>
        <Field className="sm:col-span-2" label={t.admin.address}><input name="address" required defaultValue={legal.address} className={inputClass} /></Field>
        <Field label={t.admin.registration}><input name="registration" required defaultValue={legal.registration} className={inputClass} /></Field><Field label={t.admin.vat}><input name="vatNumber" defaultValue={legal.vatNumber ?? ""} className={inputClass} /></Field>
        <div className="sm:col-span-2"><Button>{t.admin.lock}</Button></div>
      </form></section>}
    {(["awaiting_client_acceptance", "awaiting_studio_acceptance"] as string[]).includes(d.status) && <section className="card p-5"><h2 className="font-semibold">{t.admin.revisionTitle}</h2><p className="mt-2 text-sm text-muted">{t.admin.revisionBody}</p><form action={requestAdminChangesAction} className="mt-4 flex flex-col gap-3 sm:flex-row"><input type="hidden" name="id" value={d.id} /><input name="note" required minLength={3} placeholder={t.admin.requestedChanges} className={inputClass} /><Button variant="secondary">{t.admin.requestChanges}</Button></form></section>}
    {d.status === "awaiting_studio_acceptance" && <section className="card p-5"><h2 className="font-semibold">{t.admin.countersignTitle}</h2><form action={countersignDossierAction} className="mt-4 grid gap-4 sm:grid-cols-2"><input type="hidden" name="id" value={d.id} /><Field label={t.admin.fullName}><input name="signerName" required defaultValue={s.fullName} className={inputClass} /></Field><Field label={t.admin.role}><input name="signerTitle" required className={inputClass} /></Field><div className="sm:col-span-2"><Button>{t.admin.countersign}</Button></div></form></section>}
    {d.status === "awaiting_payment" && <section className="card p-5"><h2 className="font-semibold">{t.admin.paymentTitle}</h2><p className="mt-2 text-sm text-muted">{d.stripeCheckoutUrl ? t.admin.paymentSent : t.admin.paymentExpired}</p>{!d.stripeCheckoutUrl && <form action={regenerateDossierCheckoutAction} className="mt-4"><input type="hidden" name="id" value={d.id} /><Button>{t.admin.regenerate}</Button></form>}</section>}
    {!!d.documents.length && <section className="card p-5"><h2 className="font-semibold">{t.admin.documents}</h2><div className="mt-3 flex flex-wrap gap-2">{d.documents.map((doc) => <a key={doc.id} href={`/api/dossier-documents/${doc.id}`} className="rounded-full border border-line px-4 py-2 text-sm">{documentKindLabel(doc.kind, locale)} · r{doc.revision}</a>)}</div></section>}
  </div>;
}
