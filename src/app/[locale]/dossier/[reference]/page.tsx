import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { DOSSIER_COOKIE, getClientDossier } from "@/lib/contracts/service";
import { briefSections, contractsCopy, documentKindLabel, dossierStatusLabel } from "@/content/contracts";
import { ClientBriefForm } from "@/components/contracts/client-brief-form";
import { acceptClientAction, requestOtpAction } from "@/app/actions/contracts";
import { Badge, Field, inputClass, Notice } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/logo";

export const metadata = { robots: { index: false, follow: false, nocache: true } };

export default async function ClientDossierPage({ params, searchParams }: PageProps<"/[locale]/dossier/[reference]">) {
  const { locale, reference } = await params as { locale: Locale; reference: string }; const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : null;
  if (token) redirect(`/api/dossier-access?locale=${locale}&reference=${encodeURIComponent(reference)}&token=${encodeURIComponent(token)}`);
  const jar = await cookies(); const d = await getClientDossier(reference, jar.get(DOSSIER_COOKIE)?.value); const t = contractsCopy(locale).client;
  if (!d) return <main className="mx-auto max-w-xl px-5 py-20"><Logo /><div className="card mt-10 p-8"><h1 className="text-2xl font-semibold">{t.linkRequiredTitle}</h1><p className="mt-3 text-muted">{t.linkRequiredBody}</p></div></main>;
  return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><header className="mb-8 flex items-center justify-between"><Logo /><Badge>{dossierStatusLabel(d.status, locale)}</Badge></header>
    <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1><p className="mt-2 text-muted">{d.ref} · {d.clientEmail}</p>
    <div className="mt-8">
      {(["awaiting_client", "changes_requested"] as string[]).includes(d.status) && <ClientBriefForm reference={reference} copy={contractsCopy(locale)} sections={briefSections(locale)} initial={d.answers} />}
      {d.status === "affiliate_review" || d.status === "admin_review" ? <Notice>{t.submitted}</Notice> : null}
      {d.status === "awaiting_client_acceptance" && <div className="space-y-5"><Notice tone="warning">{t.readFirst}</Notice><div className="flex flex-wrap gap-2">{d.documents.filter((x) => x.revision === d.currentRevision && (x.kind === "brief" || x.kind === "quote")).map((doc) => <a key={doc.id} href={`/api/dossier-documents/${doc.id}?reference=${reference}`} className="rounded-full border border-line px-4 py-2">{documentKindLabel(doc.kind, locale)} · SHA {doc.sha256.slice(0, 12)}…</a>)}</div><form action={requestOtpAction}><input type="hidden" name="reference" value={reference} /><Button variant="secondary">{t.emailCode}</Button></form><form action={acceptClientAction} className="card grid gap-4 p-5 sm:grid-cols-2"><input type="hidden" name="reference" value={reference} /><Field label={t.fullName}><input name="name" required defaultValue={d.clientName ?? ""} className={inputClass} /></Field><Field label={t.role}><input name="title" required defaultValue={d.clientJobTitle ?? ""} className={inputClass} /></Field><Field label={t.code}><input name="code" inputMode="numeric" pattern="[0-9]{6}" required className={inputClass} /></Field><label className="flex items-center gap-3 text-sm"><input required type="checkbox" name="mandatoryTerms" />{t.acceptTerms}</label><div className="sm:col-span-2"><Button>{t.accept}</Button></div></form></div>}
      {d.status === "awaiting_studio_acceptance" && <Notice>{t.accepted}</Notice>}
      {d.status === "awaiting_payment" && <div className="card p-6"><h2 className="text-xl font-semibold">{t.paymentTitle}</h2><p className="mt-2 text-muted">{t.paymentBody}</p>{d.stripeCheckoutUrl && <a href={d.stripeCheckoutUrl} className="mt-5 inline-flex rounded-full bg-accent px-5 py-3 font-medium text-accent-fg">{t.pay}</a>}</div>}
      {d.status === "active" && <div className="card p-6"><h2 className="text-xl font-semibold">{t.activeTitle}</h2><p className="mt-2 text-muted">{t.activeBody}</p><div className="mt-4 flex flex-wrap gap-2">{d.documents.filter((doc) => doc.revision === d.currentRevision).map((doc) => <a key={doc.id} href={`/api/dossier-documents/${doc.id}?reference=${reference}`} className="rounded-full border border-line px-4 py-2">{documentKindLabel(doc.kind, locale)}</a>)}</div></div>}
    </div>
  </main>;
}
