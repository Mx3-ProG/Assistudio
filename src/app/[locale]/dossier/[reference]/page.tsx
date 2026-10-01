import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { DOSSIER_COOKIE, getClientDossier } from "@/lib/contracts/service";
import { DOSSIER_STATUS_LABELS } from "@/content/contracts";
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
  const jar = await cookies(); const d = await getClientDossier(reference, jar.get(DOSSIER_COOKIE)?.value); const fr = locale === "fr";
  if (!d) return <main className="mx-auto max-w-xl px-5 py-20"><Logo /><div className="card mt-10 p-8"><h1 className="text-2xl font-semibold">{fr ? "Lien sécurisé requis" : "Secure link required"}</h1><p className="mt-3 text-muted">{fr ? "Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien à votre conseiller." : "This link expired or was already used. Ask your advisor for a new link."}</p></div></main>;
  return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><header className="mb-8 flex items-center justify-between"><Logo /><Badge>{DOSSIER_STATUS_LABELS[locale][d.status]}</Badge></header>
    <h1 className="text-3xl font-semibold tracking-tight">{fr ? "Votre dossier Studio ATS" : "Your Studio ATS dossier"}</h1><p className="mt-2 text-muted">{d.ref} · {d.clientEmail}</p>
    <div className="mt-8">
      {(["awaiting_client", "changes_requested"] as string[]).includes(d.status) && <ClientBriefForm reference={reference} locale={locale} initial={d.answers} />}
      {d.status === "affiliate_review" || d.status === "admin_review" ? <Notice>{fr ? "Votre cahier a bien été transmis. Votre conseiller et Studio ATS le relisent." : "Your brief has been submitted. Your advisor and Studio ATS are reviewing it."}</Notice> : null}
      {d.status === "awaiting_client_acceptance" && <div className="space-y-5"><Notice tone="warning">{fr ? "Lisez les deux documents verrouillés avant d’accepter. Toute modification créera une nouvelle révision." : "Read both locked documents before accepting. Any change creates a new revision."}</Notice><div className="flex flex-wrap gap-2">{d.documents.filter((x) => x.revision === d.currentRevision && (x.kind === "brief" || x.kind === "quote")).map((doc) => <a key={doc.id} href={`/api/dossier-documents/${doc.id}?reference=${reference}`} className="rounded-full border border-line px-4 py-2">{doc.kind} · SHA {doc.sha256.slice(0, 12)}…</a>)}</div><form action={requestOtpAction}><input type="hidden" name="reference" value={reference} /><Button variant="secondary">{fr ? "Recevoir mon code par e-mail" : "Email me a code"}</Button></form><form action={acceptClientAction} className="card grid gap-4 p-5 sm:grid-cols-2"><input type="hidden" name="reference" value={reference} /><Field label={fr ? "Nom complet" : "Full name"}><input name="name" required defaultValue={d.clientName ?? ""} className={inputClass} /></Field><Field label={fr ? "Fonction" : "Role"}><input name="title" required defaultValue={d.clientJobTitle ?? ""} className={inputClass} /></Field><Field label={fr ? "Code à 6 chiffres" : "6-digit code"}><input name="code" inputMode="numeric" pattern="[0-9]{6}" required className={inputClass} /></Field><label className="flex items-center gap-3 text-sm"><input required type="checkbox" name="mandatoryTerms" />{fr ? "J’accepte le devis, les clauses et le cahier verrouillés." : "I accept the locked quote, terms and brief."}</label><div className="sm:col-span-2"><Button>{fr ? "Accepter électroniquement" : "Accept electronically"}</Button></div></form></div>}
      {d.status === "awaiting_studio_acceptance" && <Notice>{fr ? "Votre acceptation est enregistrée. Studio ATS doit maintenant contresigner le même manifeste." : "Your acceptance is recorded. Studio ATS must now countersign the same manifest."}</Notice>}
      {d.status === "awaiting_payment" && <div className="card p-6"><h2 className="text-xl font-semibold">{fr ? "Dernière étape : paiement" : "Final step: payment"}</h2><p className="mt-2 text-muted">{fr ? "La commande devient ferme lorsque Stripe confirme le premier paiement." : "The order becomes binding when Stripe confirms the first payment."}</p>{d.stripeCheckoutUrl && <a href={d.stripeCheckoutUrl} className="mt-5 inline-flex rounded-full bg-accent px-5 py-3 font-medium text-accent-fg">{fr ? "Payer avec Stripe" : "Pay with Stripe"}</a>}</div>}
      {d.status === "active" && <div className="card p-6"><h2 className="text-xl font-semibold">{fr ? "Commande confirmée" : "Order confirmed"}</h2><p className="mt-2 text-muted">{fr ? "Votre paiement a été confirmé. Les documents finaux et le dossier de preuve sont disponibles ci-dessous." : "Your payment is confirmed. Final documents and the evidence record are available below."}</p><div className="mt-4 flex flex-wrap gap-2">{d.documents.filter((doc) => doc.revision === d.currentRevision).map((doc) => <a key={doc.id} href={`/api/dossier-documents/${doc.id}?reference=${reference}`} className="rounded-full border border-line px-4 py-2">{doc.kind}</a>)}</div></div>}
    </div>
  </main>;
}
