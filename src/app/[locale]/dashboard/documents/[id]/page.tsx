import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { getDictionary } from "@/i18n";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireSession } from "@/lib/auth";
import { getDossierForUser } from "@/lib/contracts/service";
import { affiliateReviewAction } from "@/app/actions/contracts";
import { briefSections, contractCopy, dossierStatusLabel, fieldLabel, optionLabel } from "@/content/contracts";
import { PageHeader, Badge, Field, textareaClass, inputClass } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function AffiliateDossierPage({ params }: PageProps<"/[locale]/dashboard/documents/[id]">) {
  const { locale, id } = await params as { locale: Locale; id: string }; const s = await requireSession(locale); const [d, t] = await Promise.all([getDossierForUser(s, id), getDictionary(locale)]); if (!d) notFound(); const C = contractCopy(locale);
  const help = `/${locale}/dashboard/help?dossier=${d.id}&from=${encodeURIComponent(`/${locale}/dashboard/documents/${d.id}`)}`;
  return <div className="space-y-6"><PageHeader title={d.clientCompany || d.clientName || d.clientEmail} subtitle={d.ref} action={<div className="flex items-center gap-2"><Link href={help} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg"><LifeBuoy className="size-4" />{t.net.help.ask}</Link><Badge>{dossierStatusLabel(d.status, locale)}</Badge></div>} />
    {d.currentRevision > 0 && <div className="grid gap-4">{briefSections(locale).map((section) => <section key={section.id} className="card p-5"><h2 className="font-semibold">{section.title}</h2><dl className="mt-3 grid gap-3 sm:grid-cols-2">{section.fields.map((field) => d.answers[field.key] ? <div key={field.key}><dt className="text-xs text-muted">{fieldLabel(field, locale)}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{Array.isArray(d.answers[field.key]) ? (d.answers[field.key] as unknown[]).map((x) => optionLabel(String(x), locale)).join(", ") : String(d.answers[field.key])}</dd></div> : null)}</dl></section>)}</div>}
    {d.status === "affiliate_review" && <section className="card p-5"><h2 className="font-semibold">{C.affiliate.reviewTitle}</h2><form action={affiliateReviewAction} className="mt-4 grid gap-4"><input type="hidden" name="id" value={d.id} /><Field label={C.affiliate.recommendation}><select name="tier" defaultValue="pro" className={inputClass}><option value="one">Studio One</option><option value="pro">Studio Pro</option><option value="premium">Studio Premium</option></select></Field><Field label={C.affiliate.comment}><textarea name="note" required minLength={3} className={textareaClass} /></Field><div className="flex flex-wrap gap-2"><Button name="action" value="submit">{C.affiliate.sendToAdmin}</Button><Button name="action" value="changes" variant="secondary">{C.affiliate.requestChanges}</Button></div></form></section>}
    {!!d.documents.length && <section className="card p-5"><h2 className="font-semibold">{C.affiliate.locked}</h2><div className="mt-3 flex flex-wrap gap-2">{d.documents.map((doc) => <a key={doc.id} className="rounded-full border border-line px-4 py-2 text-sm" href={`/api/dossier-documents/${doc.id}`}>{C.docKinds[doc.kind] ?? doc.kind} · SHA {doc.sha256.slice(0, 10)}…</a>)}</div></section>}
  </div>;
}
