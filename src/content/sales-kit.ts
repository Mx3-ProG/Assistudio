/**
 * Default sales-kit entries (seed + fallback for `public.sales_assets`).
 * Copyable text assets only; files (visuals, videos, decks) are uploaded by
 * staff to Supabase Storage from the admin.
 */
import type { Locale } from "@/i18n/config";

export type AssetType =
  | "email" | "whatsapp" | "linkedin" | "instagram" | "cold_call" | "objection"
  | "visual" | "video" | "presentation";

export interface SalesAsset {
  id: string;
  type: AssetType;
  locale: Locale;
  title: string;
  body?: string;
  filePath?: string;
}

let n = 0;
const a = (type: AssetType, locale: Locale, title: string, body: string): SalesAsset => ({
  id: `asset_${++n}`, type, locale, title, body,
});

export const defaultSalesAssets: SalesAsset[] = [
  // ---------------------------------------------------------------- EN
  a("email", "en", "First contact — portfolio businesses",
`Subject: [Company] — turning visitors into booked calls

Hi [First name],

I came across [Company] and really liked [specific project].

Quick question: when someone discovers your work online, what happens next? Most professionals I speak with get requests through a mix of forms, Instagram and email — without budget, timing or project details.

STUDIO fixes that. It’s an online commercial studio that presents your work, qualifies each request and books the appointment automatically. We build and run it for you.

Would a 10-minute look be useful? Here’s an overview: [your link]

Best,
[Your name]`),
  a("email", "en", "Follow-up after 3 days",
`Subject: Re: [Company] — turning visitors into booked calls

Hi [First name],

Just bringing this back to the top of your inbox. If requests that arrive without budget or timing sound familiar, STUDIO is worth 10 minutes: [your link]

If it’s not a priority right now, no problem at all — just tell me and I won’t follow up again.

[Your name]`),
  a("whatsapp", "en", "Short intro",
`Hi [First name] 👋 I saw your work on [project] — really nice. I work with STUDIO: it turns your portfolio into a space that qualifies requests and books calls automatically. Can I send you a 2-minute overview?`),
  a("whatsapp", "en", "After a call",
`Thanks for the call, [First name]! Here’s the STUDIO page we discussed: [your link]. Let me know if you have any questions.`),
  a("linkedin", "en", "Connection note",
`Hi [First name], I help [profession] turn their online visibility into qualified appointments. Would love to connect.`),
  a("linkedin", "en", "Message after connecting",
`Thanks for connecting, [First name]. I noticed [Company] works on [type of project]. How do new clients usually reach you? I work with STUDIO, which qualifies requests and books discovery calls automatically. Happy to share a short overview if useful: [your link]`),
  a("instagram", "en", "DM — portfolio creators",
`Hi! Your feed is beautiful 🙌 Quick question: when someone wants to book you, do they just DM? STUDIO turns your portfolio into a booking space that asks date, budget and project type upfront. Want me to send the link?`),
  a("cold_call", "en", "Cold call script",
`1. Opening — "Hi [First name], it’s [Your name]. I’ll be brief: I help [profession] turn website visitors into qualified appointments. Do you have 30 seconds?"
2. Question — "Today, when someone finds your work online, how do they contact you?"
3. Listen. Reformulate the problem (scattered requests, no qualification, forgotten follow-ups).
4. Pitch — "STUDIO is a commercial studio built for you: portfolio, request qualification, appointments, automatic emails and follow-ups. The team builds and runs it."
5. Next step — "Can I send you the overview and book 15 minutes to go through it?"`),
  a("objection", "en", "“I already have a website.”",
`That’s great — STUDIO isn’t about replacing a nice site. The question is what happens after the visit: are requests qualified? Are follow-ups automatic? Do you know which sources bring real clients? The website is one component; STUDIO is the whole path to the appointment.`),
  a("objection", "en", "“It’s too expensive.”",
`It’s a fair question. How much is one new client worth to you? STUDIO is €6,000 a year, everything included. For a professional whose clients have high value, the question is whether it helps convert the requests you already get. [Avoid promising results — let them do their own math.]`),
  a("objection", "en", "“I only work with Instagram.”",
`Instagram is excellent for being discovered. STUDIO is where that attention turns into a structured request — with date, budget and project details — instead of another DM to chase. It complements Instagram; it doesn’t replace it.`),
  a("objection", "en", "“I don’t need automation.”",
`Understood. Automation here just means the confirmation email, the reminder and the follow-up go out on time — the things that get forgotten on busy weeks. You stay in control of every conversation.`),
  a("objection", "en", "“I need to think about it.”",
`Of course. To help you think it through: what would need to be true for this to be worth it for you? I’ll send you the overview [your link] and check back on [day] — does that work?`),
  // ---------------------------------------------------------------- FR
  a("email", "fr", "Premier contact — métiers à portfolio",
`Objet : [Entreprise] — transformer vos visiteurs en rendez-vous

Bonjour [Prénom],

J’ai découvert [Entreprise] et j’ai beaucoup aimé [projet précis].

Petite question : quand quelqu’un découvre votre travail en ligne, que se passe-t-il ensuite ? La plupart des professionnels que je rencontre reçoivent des demandes par formulaire, Instagram et email — sans budget, délai ni détail du projet.

STUDIO règle ça. C’est un studio commercial en ligne qui présente votre travail, qualifie chaque demande et programme le rendez-vous automatiquement. L’équipe le construit et le fait tourner pour vous.

Un aperçu de 10 minutes vous serait utile ? Voici une présentation : [votre lien]

Bien à vous,
[Votre nom]`),
  a("email", "fr", "Relance à 3 jours",
`Objet : Re : [Entreprise] — transformer vos visiteurs en rendez-vous

Bonjour [Prénom],

Je remonte simplement ce message. Si les demandes sans budget ni délai vous parlent, STUDIO vaut 10 minutes : [votre lien]

Si ce n’est pas une priorité, aucun souci — dites-le-moi et je ne vous relancerai plus.

[Votre nom]`),
  a("whatsapp", "fr", "Intro courte",
`Bonjour [Prénom] 👋 J’ai vu votre travail sur [projet], très beau. Je travaille avec STUDIO : il transforme votre portfolio en espace qui qualifie les demandes et programme les appels automatiquement. Je vous envoie une présentation de 2 minutes ?`),
  a("linkedin", "fr", "Note d’invitation",
`Bonjour [Prénom], j’aide les [métier] à transformer leur visibilité en ligne en rendez-vous qualifiés. Ravi d’échanger.`),
  a("instagram", "fr", "DM — créateurs à portfolio",
`Bonjour ! Votre feed est superbe 🙌 Petite question : quand quelqu’un veut vous réserver, il vous écrit en DM ? STUDIO transforme votre portfolio en espace de réservation qui demande date, budget et type de projet. Je vous envoie le lien ?`),
  a("cold_call", "fr", "Script d’appel",
`1. Accroche — « Bonjour [Prénom], [Votre nom]. Je serai bref : j’aide les [métier] à transformer les visiteurs de leur site en rendez-vous qualifiés. Vous avez 30 secondes ? »
2. Question — « Aujourd’hui, quand quelqu’un découvre votre travail en ligne, comment vous contacte-t-il ? »
3. Écoutez. Reformulez le problème (demandes dispersées, pas de qualification, relances oubliées).
4. Pitch — « STUDIO est un studio commercial construit pour vous : portfolio, qualification des demandes, rendez-vous, emails et relances automatiques. L’équipe le construit et le fait tourner. »
5. Suite — « Je vous envoie la présentation et on bloque 15 minutes pour la parcourir ? »`),
  a("objection", "fr", "« J’ai déjà un site. »",
`Très bien — STUDIO ne remplace pas un beau site. La question, c’est ce qui se passe après la visite : les demandes sont-elles qualifiées ? Les relances automatiques ? Savez-vous quelles sources amènent de vrais clients ? Le site est une composante ; STUDIO, c’est tout le chemin jusqu’au rendez-vous.`),
  a("objection", "fr", "« C’est trop cher. »",
`C’est une bonne question. Combien vaut un nouveau client pour vous ? STUDIO coûte 6 000 € par an, tout compris. Pour un professionnel dont les clients ont une forte valeur, la question est de savoir s’il aide à convertir les demandes que vous recevez déjà. [Ne promettez pas de résultat — laissez le prospect faire son propre calcul.]`),
  a("objection", "fr", "« Je travaille uniquement avec Instagram. »",
`Instagram est excellent pour être découvert. STUDIO est l’endroit où cette attention devient une demande structurée — avec date, budget et détails — au lieu d’un énième DM à relancer. Il complète Instagram, il ne le remplace pas.`),
  a("objection", "fr", "« Je n’ai pas besoin d’automatisation. »",
`Je comprends. Ici, l’automatisation signifie simplement que l’email de confirmation, le rappel et la relance partent à temps — ce qu’on oublie les semaines chargées. Vous gardez la main sur chaque conversation.`),
  a("objection", "fr", "« Je dois réfléchir. »",
`Bien sûr. Pour vous aider : qu’est-ce qui devrait être vrai pour que ça en vaille la peine pour vous ? Je vous envoie la présentation [votre lien] et je reviens vers vous [jour] — ça vous va ?`),
];

export function assetsFor(locale: Locale): SalesAsset[] {
  const local = defaultSalesAssets.filter((x) => x.locale === locale);
  return local.length ? local : defaultSalesAssets.filter((x) => x.locale === "en");
}
