/**
 * V0.5 guided pipeline — starter content (seed + demo store). Every item is a
 * `public.sales_content` row, editable in Admin → Sales content:
 *   stage_guide  what to do at each CRM stage (a row with targetKey = a sector override)
 *   reply        what the prospect said → answer level 1/2/3 + next step
 *   fact         official Studio information, incl. what may / may not be promised
 *   find_source  where a beginner finds first prospects
 *
 * Rules: no figures that live in the database (prices, rates, validation
 * days are read live on the "Official info" page), no promise of results,
 * the ambassador never negotiates the price.
 */
import type { BodyByKind, ContentKind, StageGuideBody, ReplyBody, FactBody, FindSourceBody } from "../../lib/sales/content.ts";
import type { SeedContent } from "./content.ts";

function both<K extends ContentKind>(kind: K, key: string, sort: number, en: { title: string; body: BodyByKind[K] }, fr: { title: string; body: BodyByKind[K] }, targetKey?: string): SeedContent[] {
  return [
    { kind, key, locale: "en", status: "active", sort, targetKey, ...en } as SeedContent,
    { kind, key, locale: "fr", status: "active", sort, targetKey, ...fr } as SeedContent,
  ];
}

// =============================================================== stage guides
type Outcome = NonNullable<StageGuideBody["outcomes"]>[number];
type G = Omit<StageGuideBody, "stage" | "outcomes"> & { outcomes: [string, Outcome["to"], Outcome["event"]][] };
const guide = (stage: StageGuideBody["stage"], g: G): StageGuideBody =>
  ({ ...g, stage, outcomes: g.outcomes.map(([label, to, event]) => ({ label, to, event })) });

const STAGES: [StageGuideBody["stage"], G, G][] = [
  ["new",
    { goal: "Get a reply.", why: "You haven’t exchanged with this person yet.", action: "Send the first message.", say: "first_contact", show: "none",
      dont: "Don’t try to sell the whole Studio offer yet. One short message, one question.",
      outcomes: [["I sent the message", "contacted", "message_sent"]],
      escalate: "Not sure how to approach them? Ask Studio in your Support thread — you won’t look amateur." },
    { goal: "Obtenir une réponse.", why: "Vous n’avez encore eu aucun échange avec cette personne.", action: "Envoyez le premier message.", say: "first_contact", show: "none",
      dont: "Ne cherchez pas encore à vendre toute l’offre Studio. Un message court, une question.",
      outcomes: [["J’ai envoyé le message", "contacted", "message_sent"]],
      escalate: "Pas sûr de la bonne approche ? Demandez à Studio dans votre fil Support — vous ne paraîtrez pas amateur." }],
  ["contacted",
    { goal: "Get a reply — patiently.", why: "Your message is sent; people often answer after a few days.", action: "Wait, then follow up at the right moment.", show: "none",
      dont: "Don’t send several messages in a row.",
      outcomes: [["They replied", "replied", "reply_received"], ["No interest", "lost", "lost"]] },
    { goal: "Obtenir une réponse — avec patience.", why: "Votre message est parti ; on répond souvent après quelques jours.", action: "Attendez, puis relancez au bon moment.", show: "none",
      dont: "N’envoyez pas plusieurs messages d’affilée.",
      outcomes: [["Il/elle a répondu", "replied", "reply_received"], ["Pas intéressé", "lost", "lost"]] }],
  ["replied",
    { goal: "Understand their situation.", why: "They answered: now listen before you present anything.", action: "Ask 2 or 3 questions about how they work today.", show: "none", ask: "yes",
      collect: ["How clients reach them today", "Which tools they use", "What makes them lose time"],
      dont: "Don’t pitch features. Ask, listen, note.",
      outcomes: [["I understood their need", "qualified", "need_identified"], ["Not for them", "lost", "lost"]] },
    { goal: "Comprendre sa situation.", why: "Il/elle a répondu : écoutez avant de présenter quoi que ce soit.", action: "Posez 2 ou 3 questions sur son fonctionnement actuel.", show: "none", ask: "yes",
      collect: ["Comment les clients le/la contactent aujourd’hui", "Quels outils il/elle utilise", "Ce qui lui fait perdre du temps"],
      dont: "Ne présentez pas de fonctionnalités. Questionnez, écoutez, notez.",
      outcomes: [["J’ai compris son besoin", "qualified", "need_identified"], ["Ce n’est pas pour lui/elle", "lost", "lost"]] }],
  ["qualified",
    { goal: "Spark interest with their own problem.", why: "You know what bothers them: connect it to what Studio does.", action: "Repeat their problem in one sentence, then say how Studio takes it off their hands.", show: "none",
      dont: "Talk about their problem, not about technology.",
      outcomes: [["They’re interested", "interested", "interest"], ["Not now", "lost", "lost"]] },
    { goal: "Susciter l’intérêt avec son propre problème.", why: "Vous savez ce qui le/la gêne : reliez-le à ce que fait Studio.", action: "Reformulez son problème en une phrase, puis dites comment Studio l’en débarrasse.", show: "none",
      dont: "Parlez de son problème, pas de technologie.",
      outcomes: [["Il/elle est intéressé(e)", "interested", "interest"], ["Pas maintenant", "lost", "lost"]] }],
  ["interested",
    { goal: "Prove it with a real project.", why: "Interest is there: a concrete example is more convincing than any explanation.", action: "Send a project close to their sector.", show: "case_study",
      outcomes: [["I sent the project", "proof_sent", "proof_sent"]] },
    { goal: "Le prouver avec un projet réel.", why: "L’intérêt est là : un exemple concret convainc plus que toute explication.", action: "Envoyez un projet proche de son secteur.", show: "case_study",
      outcomes: [["J’ai envoyé le projet", "proof_sent", "proof_sent"]] }],
  ["proof_sent",
    { goal: "Present the offer — or propose a meeting.", why: "They have seen what Studio does. Now show the official offer, or let Studio talk to them.", action: "Send your sales page (official offer and price), or propose a 20-minute meeting.", say: "proposal", show: "page",
      dont: "Never change, negotiate or promise a price or a delivery date yourself.",
      outcomes: [["I presented the offer", "proposal", "offer_presented"], ["They want a meeting", "appointment", "meeting"]],
      escalate: "Specific question about their project? Hand them over to Studio." },
    { goal: "Présenter l’offre — ou proposer un rendez-vous.", why: "Il/elle a vu ce que fait Studio. Montrez maintenant l’offre officielle, ou laissez Studio lui parler.", action: "Envoyez votre page commerciale (offre et prix officiels), ou proposez un rendez-vous de 20 minutes.", say: "proposal", show: "page",
      dont: "Ne modifiez, négociez ni promettez jamais un prix ou un délai vous-même.",
      outcomes: [["J’ai présenté l’offre", "proposal", "offer_presented"], ["Il/elle veut un rendez-vous", "appointment", "meeting"]],
      escalate: "Question précise sur son projet ? Passez-le/la à Studio." }],
  ["proposal",
    { goal: "Help them decide.", why: "They have the offer. Answer questions; don’t push.", action: "Ask if anything is unclear, then follow up at the planned dates.", show: "offer",
      outcomes: [["They want a meeting", "appointment", "meeting"], ["They want a quote", "checkout", "quote"], ["They bought", "won", "won"], ["Not now", "lost", "lost"]],
      escalate: "Contract, invoice, technical scope or custom need: hand over to Studio." },
    { goal: "L’aider à décider.", why: "Il/elle a l’offre. Répondez aux questions ; ne forcez pas.", action: "Demandez si quelque chose reste flou, puis relancez aux dates prévues.", show: "offer",
      outcomes: [["Il/elle veut un rendez-vous", "appointment", "meeting"], ["Il/elle veut un devis", "checkout", "quote"], ["Il/elle a acheté", "won", "won"], ["Pas maintenant", "lost", "lost"]],
      escalate: "Contrat, facture, périmètre technique ou besoin sur mesure : passez à Studio." }],
  ["appointment",
    { goal: "Let Studio take the meeting.", why: "A meeting is where the details come up — Studio handles them.", action: "Hand the prospect to Studio with what you learned. You can join the call if you wish.", show: "none",
      outcomes: [["I handed over to Studio", "handed_off", "handed_off"]],
      escalate: "This is the moment: use “Hand over to Studio”. The prospect stays attributed to you." },
    { goal: "Laisser Studio mener le rendez-vous.", why: "C’est en rendez-vous que les détails arrivent — Studio s’en charge.", action: "Passez le prospect à Studio avec ce que vous avez appris. Vous pouvez participer à l’appel si vous le souhaitez.", show: "none",
      outcomes: [["Je l’ai passé à Studio", "handed_off", "handed_off"]],
      escalate: "C’est le moment : utilisez « Passer à Studio ». Le prospect reste attribué à vous." }],
  ["handed_off",
    { goal: "Stay in the loop.", why: "Studio is handling the conversation. Your attribution and commission are kept.", action: "Answer Studio if it asks you something; keep a friendly contact with the prospect.", show: "none",
      outcomes: [["A quote was sent", "checkout", "quote"], ["They bought", "won", "won"], ["It didn’t happen", "lost", "lost"]] },
    { goal: "Rester dans la boucle.", why: "Studio mène la conversation. Votre attribution et votre commission sont conservées.", action: "Répondez à Studio s’il vous demande quelque chose ; gardez un contact cordial avec le prospect.", show: "none",
      outcomes: [["Un devis a été envoyé", "checkout", "quote"], ["Il/elle a acheté", "won", "won"], ["Ça ne s’est pas fait", "lost", "lost"]] }],
  ["checkout",
    { goal: "Let them sign at their pace.", why: "The quote or payment is in progress.", action: "One personal check-in at most; Studio answers contract questions.", show: "none",
      dont: "No pressure, no reminder chain.",
      outcomes: [["They bought", "won", "won"], ["Not now", "lost", "lost"]] },
    { goal: "Le/la laisser signer à son rythme.", why: "Le devis ou le paiement est en cours.", action: "Un seul message personnel au plus ; Studio répond aux questions de contrat.", show: "none",
      dont: "Pas de pression, pas de chaîne de relances.",
      outcomes: [["Il/elle a acheté", "won", "won"], ["Pas maintenant", "lost", "lost"]] }],
  ["won",
    { goal: "Keep the relationship.", why: "It’s a sale — well done. Your commission follows its validation period.", action: "Thank them, and ask if they know someone in the same situation.", show: "none", say: "renewal", outcomes: [] },
    { goal: "Garder la relation.", why: "C’est une vente — bravo. Votre commission suit sa période de validation.", action: "Remerciez-le/la, et demandez s’il/elle connaît quelqu’un dans la même situation.", show: "none", say: "renewal", outcomes: [] }],
  ["lost",
    { goal: "Leave a good impression.", why: "Not now doesn’t mean never.", action: "Thank them and plan to come back in a few months.", show: "none", say: "no_response",
      outcomes: [["Restart the conversation", "contacted", "message_sent"]] },
    { goal: "Laisser une bonne impression.", why: "Pas maintenant ne veut pas dire jamais.", action: "Remerciez et prévoyez de revenir dans quelques mois.", show: "none", say: "no_response",
      outcomes: [["Reprendre la conversation", "contacted", "message_sent"]] }],
];
const stageGuides = STAGES.flatMap(([stage, en, fr], i) =>
  both("stage_guide", `stage.${stage}`, i, { title: en.goal, body: guide(stage, en) }, { title: fr.goal, body: guide(stage, fr) }));

// Sector override example (hotels): the first contact talks about direct bookings.
const hotelNew = both("stage_guide", "stage.new.hospitality", 0,
  { title: "Get a reply (hotel)", body: guide("new", { ...STAGES[0][1], why: "You haven’t exchanged yet. Hoteliers are busy: one short question about direct bookings works best.", outcomes: STAGES[0][1].outcomes }) },
  { title: "Obtenir une réponse (hôtel)", body: guide("new", { ...STAGES[0][2], why: "Aucun échange pour l’instant. Les hôteliers sont occupés : une seule question courte sur les réservations directes fonctionne le mieux.", outcomes: STAGES[0][2].outcomes }) },
  "hospitality");

// =============================================================== replies
type Rp = Omit<ReplyBody, "show" | "level"> & { show?: ReplyBody["show"] };
const REPLIES: [string, 1 | 2 | 3, ReplyBody["show"], Rp, Rp][] = [
  ["interested", 1, "case_study",
    { said: "“I’m interested.”", answer: "Great! To show you something relevant: how do new clients reach you today?", question: "Who manages your website and tools today?", to: "interested", next: "Send a project close to their sector." },
    { said: "« Je suis intéressé. »", answer: "Super ! Pour vous montrer quelque chose de pertinent : comment les nouveaux clients vous contactent-ils aujourd’hui ?", question: "Qui gère votre site et vos outils aujourd’hui ?", to: "interested", next: "Envoyez un projet proche de son secteur." }],
  ["price", 1, "offer",
    { said: "“How much does it cost?”", meaning: "A buying signal — not an objection.", answer: "There are three official offers, from a one-time purchase to a complete ecosystem run by Studio. Here they are, with their prices — which one fits you best?", question: "What would you most like Studio to take off your hands?", to: "proposal", next: "Send your sales page. Never give a discount or a custom price yourself." },
    { said: "« Combien ça coûte ? »", meaning: "Un signal d’achat — pas une objection.", answer: "Il y a trois offres officielles, de l’achat unique à l’écosystème complet opéré par Studio. Les voici avec leurs prix — laquelle vous correspond le mieux ?", question: "Qu’aimeriez-vous le plus que Studio vous enlève ?", to: "proposal", next: "Envoyez votre page commerciale. Ne donnez jamais de remise ni de prix sur mesure vous-même." }],
  ["send-info", 2, "case_study",
    { said: "“Send me some information.”", meaning: "Often a polite way to end the call — make the information personal.", answer: "With pleasure. So I don’t send you a generic brochure: what matters most to you — getting more requests, saving time, or not dealing with the technical side?", question: "When can I call you back to see if it fits?", to: "interested", next: "Send ONE project close to them + your page, and agree on a date to talk again." },
    { said: "« Envoyez-moi des informations. »", meaning: "Souvent une façon polie de conclure — rendez l’information personnelle.", answer: "Avec plaisir. Pour ne pas vous envoyer une brochure générique : qu’est-ce qui compte le plus pour vous — plus de demandes, gagner du temps, ou ne plus gérer la technique ?", question: "Quand puis-je vous rappeler pour voir si ça vous correspond ?", to: "interested", next: "Envoyez UN projet proche + votre page, et convenez d’une date pour en reparler." }],
  ["already-website", 2, "case_study",
    { said: "“I already have a website.”", meaning: "Not a no: they think Studio is “a website”.", answer: "Perfect, keep it if it works. Studio is not just a site: it’s the team that runs your whole digital side — requests, follow-ups, tools.", question: "What happens today after someone fills in your form?", objection: "already-website", to: "qualified", next: "Listen to the answer, then show a project where requests are centralised." },
    { said: "« J’ai déjà un site. »", meaning: "Pas un refus : il/elle pense que Studio est « un site ».", answer: "Parfait, gardez-le s’il fonctionne. Studio n’est pas juste un site : c’est l’équipe qui fait tourner tout votre numérique — demandes, relances, outils.", question: "Que se passe-t-il aujourd’hui après qu’on a rempli votre formulaire ?", objection: "already-website", to: "qualified", next: "Écoutez la réponse, puis montrez un projet où les demandes sont centralisées." }],
  ["someone-handles-it", 2, "none",
    { said: "“I already have someone who handles that.”", meaning: "A relationship to respect — and maybe a gap to find.", answer: "That’s great. Studio often works alongside: is that person available all year for hosting, security, changes and follow-ups?", question: "What would you like them to do that they don’t have time for?", to: "qualified", next: "If there’s a gap, note it. If not, leave a good impression and come back later." },
    { said: "« J’ai déjà quelqu’un qui gère ça. »", meaning: "Une relation à respecter — et peut-être un manque à trouver.", answer: "Très bien. Studio travaille souvent en complément : cette personne est-elle disponible toute l’année pour l’hébergement, la sécurité, les modifications et les relances ?", question: "Qu’aimeriez-vous qu’elle fasse et qu’elle n’a pas le temps de faire ?", to: "qualified", next: "S’il y a un manque, notez-le. Sinon, laissez une bonne impression et revenez plus tard." }],
  ["no-time", 2, "none",
    { said: "“I don’t have time.”", meaning: "Not the right moment — or they fear more work.", answer: "Precisely: Studio is for people who don’t have time. We build and run it; you answer the requests.", question: "When would be a calmer moment to look at it for 10 minutes?", objection: "no-time", next: "Agree on a date and note it — never insist." },
    { said: "« Je n’ai pas le temps. »", meaning: "Pas le bon moment — ou peur d’avoir plus de travail.", answer: "Justement : Studio est fait pour ceux qui n’ont pas le temps. Nous construisons et faisons tourner ; vous répondez aux demandes.", question: "Quel serait un moment plus calme pour y jeter un œil 10 minutes ?", objection: "no-time", next: "Convenez d’une date et notez-la — sans jamais insister." }],
  ["call-later", 1, "none",
    { said: "“Call me back later.”", answer: "Of course. When exactly suits you — this week or next?", next: "Write the date as the next action of this prospect: the copilot will remind you." },
    { said: "« Rappelez-moi plus tard. »", answer: "Bien sûr. Quand exactement vous arrange — cette semaine ou la suivante ?", next: "Notez la date comme prochaine action de ce prospect : le copilote vous la rappellera." }],
  ["talk-to-someone", 3, "none",
    { said: "“I want to talk to someone directly.”", meaning: "A strong buying signal: let Studio take it.", answer: "Of course — I’ll put you in touch with the Studio team, who will call you. What’s the best time and number?", to: "handed_off", next: "Hand the prospect over to Studio now, with their availability. You keep the attribution." },
    { said: "« Je veux parler directement à quelqu’un. »", meaning: "Un fort signal d’achat : laissez Studio prendre le relais.", answer: "Bien sûr — je vous mets en contact avec l’équipe Studio, qui vous appellera. Quel est le meilleur moment et le meilleur numéro ?", to: "handed_off", next: "Passez le prospect à Studio maintenant, avec ses disponibilités. Vous gardez l’attribution." }],
  ["technical", 3, "none",
    { said: "A technical, legal or contract question", meaning: "Not your job — and that’s fine.", answer: "Good question — I want you to have the exact answer, so I’m asking the Studio team and coming back to you.", to: "handed_off", next: "Hand over to Studio with the exact question. Never improvise a technical or legal answer." },
    { said: "Une question technique, juridique ou contractuelle", meaning: "Ce n’est pas votre rôle — et c’est très bien.", answer: "Bonne question — je veux que vous ayez la réponse exacte, je la pose à l’équipe Studio et je reviens vers vous.", to: "handed_off", next: "Passez à Studio avec la question exacte. N’improvisez jamais une réponse technique ou juridique." }],
  ["not-interested", 1, "none",
    { said: "“Not interested.”", answer: "Thank you for your honesty. If one day the digital side becomes a topic, I’m here.", to: "lost", next: "Mark it lost — you can revisit in a few months." },
    { said: "« Pas intéressé. »", answer: "Merci pour votre franchise. Si un jour le numérique devient un sujet, je suis là.", to: "lost", next: "Marquez-le perdu — vous pourrez revenir dans quelques mois." }],
];
const replies = REPLIES.flatMap(([key, level, show, en, fr], i) =>
  both("reply", key, i, { title: en.said, body: { ...en, level, show } }, { title: fr.said, body: { ...fr, level, show } }));

// =============================================================== official facts
type F = [FactBody["category"], 1 | 2 | 3, [string, string, string[]?, string[]?], [string, string, string[]?, string[]?]];
const FACTS: F[] = [
  ["promises", 1,
    ["What can I promise — and what not?", "Promise only what is written here and on the official offer pages. When in doubt, ask Studio.",
      ["The official offers and their published prices", "That Studio designs, builds and runs what the chosen offer includes", "That the client owns their code and data (Pro and Premium)", "That Studio answers technical and contract questions"],
      ["A discount (other than your own promo code)", "A delivery date other than the one announced on the offer", "A feature not listed in the offer", "Results: revenue, number of clients, bookings, rankings", "A guarantee or a commitment not written in the contract"]],
    ["Que puis-je promettre — et que ne dois-je pas promettre ?", "Ne promettez que ce qui est écrit ici et sur les pages officielles des offres. En cas de doute, demandez à Studio.",
      ["Les offres officielles et leurs prix publiés", "Que Studio conçoit, construit et fait fonctionner ce que l’offre choisie inclut", "Que le client reste propriétaire de son code et de ses données (Pro et Premium)", "Que Studio répond aux questions techniques et contractuelles"],
      ["Une remise (autre que votre propre code promo)", "Un délai autre que celui annoncé sur l’offre", "Une fonctionnalité qui n’est pas listée dans l’offre", "Des résultats : chiffre d’affaires, nombre de clients, réservations, classement", "Une garantie ou un engagement non écrit au contrat"]]],
  ["company", 1,
    ["Who is Studio?", "Studio ATS (“à ton service”) is the team that builds and runs the digital infrastructure of independents and small businesses: presence, tools, requests, follow-ups, hosting, security."],
    ["Qui est Studio ?", "Studio ATS (« à ton service ») est l’équipe qui construit et fait fonctionner l’infrastructure numérique des indépendants et des petites entreprises : présence, outils, demandes, relances, hébergement, sécurité."]],
  ["contact", 1,
    ["How do I reach Studio?", "Your Support thread in Messages: the whole Studio team reads it. Your prospect can use the public contact page or your sales page."],
    ["Comment joindre Studio ?", "Votre fil Support dans la messagerie : toute l’équipe Studio le lit. Votre prospect peut utiliser la page contact publique ou votre page commerciale."]],
  ["offers", 1,
    ["What are the offers?", "Three offers of the same product: Studio One (a ready-to-use presence, bought once, delivered as is), Studio Pro (a complete, customisable site maintained all year), Studio Premium (the whole commercial ecosystem — CRM, payments, automations — operated by Studio). Details on the official pricing page."],
    ["Quelles sont les offres ?", "Trois offres du même produit : Studio One (une présence prête à l’emploi, achetée une fois, livrée telle quelle), Studio Pro (un site complet et personnalisable maintenu toute l’année), Studio Premium (tout l’écosystème commercial — CRM, paiements, automatisations — opéré par Studio). Détails sur la page tarifs officielle."]],
  ["pricing", 1,
    ["What are the prices? Can I negotiate?", "The official prices are shown at the top of this page, read live from the catalogue. They are the same for everyone. You never negotiate: the only reduction you may offer is your own promo code, which is deducted from your commission."],
    ["Quels sont les prix ? Puis-je négocier ?", "Les prix officiels sont affichés en haut de cette page, lus en direct dans le catalogue. Ils sont identiques pour tous. Vous ne négociez jamais : la seule réduction possible est votre propre code promo, déduit de votre commission."]],
  ["process", 1,
    ["How does it work for the client?", "1. The client chooses an offer (online, or through a client dossier prepared with Studio). 2. Studio gathers the needs. 3. Studio builds and configures. 4. Launch, then Studio runs it according to the offer."],
    ["Comment ça se passe pour le client ?", "1. Le client choisit une offre (en ligne, ou via un dossier client préparé avec Studio). 2. Studio recueille les besoins. 3. Studio construit et configure. 4. Mise en ligne, puis Studio fait fonctionner selon l’offre."]],
  ["delays", 2,
    ["What delivery time can I announce?", "Only the one written on the official offer (the pricing page announces it per offer, counted after acceptance). For a custom project, the date is given by Studio — never by you."],
    ["Quel délai puis-je annoncer ?", "Uniquement celui écrit sur l’offre officielle (la page tarifs l’annonce par offre, compté après acceptation). Pour un projet sur mesure, la date est donnée par Studio — jamais par vous."]],
  ["payment", 1,
    ["How does the client pay?", "By card through Stripe, on the official checkout page (via your link, your page or a client dossier). Studio One is a one-time payment; Pro and Premium are billed yearly."],
    ["Comment le client paie-t-il ?", "Par carte via Stripe, sur la page de paiement officielle (par votre lien, votre page ou un dossier client). Studio One est un paiement unique ; Pro et Premium sont facturés à l’année."]],
  ["support", 1,
    ["Who supports the client after the sale?", "The Studio team, according to the offer: Pro and Premium include hosting, maintenance, security, backups and monthly revision time. Studio One is delivered as is."],
    ["Qui accompagne le client après la vente ?", "L’équipe Studio, selon l’offre : Pro et Premium incluent hébergement, maintenance, sécurité, sauvegardes et du temps de révision mensuel. Studio One est livré tel quel."]],
  ["maintenance", 2,
    ["Is a new feature included?", "Only what the chosen offer lists. Anything else is a new quote by Studio. Don’t say yes yourself — hand the question over."],
    ["Une nouvelle fonctionnalité est-elle incluse ?", "Seulement ce que l’offre choisie liste. Le reste fait l’objet d’un nouveau devis de Studio. Ne dites pas oui vous-même — transmettez la question."]],
  ["commissions", 1,
    ["How am I paid?", "Your rate and your sponsor rate are shown at the top of this page. A commission is created when Studio receives the payment, stays “pending” during the validation period (refunds, disputes), becomes “available”, then is paid out. Annual renewals pay again."],
    ["Comment suis-je payé ?", "Votre taux et celui de parrainage sont affichés en haut de cette page. Une commission est créée quand Studio reçoit le paiement, reste « en validation » pendant la période de validation (remboursements, litiges), devient « disponible », puis vous est versée. Les renouvellements annuels paient à nouveau."]],
  ["after_sale", 1,
    ["If I hand a prospect to Studio, do I keep my commission?", "Yes. The prospect stays in your CRM and attributed to you. For the sale to be credited, the client pays through your link, your page, your code, or a client dossier created from your account."],
    ["Si je passe un prospect à Studio, je garde ma commission ?", "Oui. Le prospect reste dans votre CRM et attribué à vous. Pour que la vente vous soit créditée, le client paie via votre lien, votre page, votre code, ou un dossier client créé depuis votre compte."]],
  ["references", 2,
    ["Which references can I show?", "Only the projects in “Find what to send”. Respect their label: a “Demo” is an example, not a client. Never name a client that isn’t listed."],
    ["Quelles références puis-je montrer ?", "Uniquement les projets de « Trouver quoi lui envoyer ». Respectez leur étiquette : une « Démo » est un exemple, pas un client. Ne citez jamais un client non listé."]],
  ["documents", 3,
    ["Contract, invoice, legal or GDPR question?", "Always Studio. Hand over the prospect with the exact question."],
    ["Question de contrat, facture, juridique ou RGPD ?", "Toujours Studio. Passez le prospect avec la question exacte."]],
];
const facts = FACTS.flatMap(([category, level, en, fr], i) =>
  both("fact", `fact.${category}`, i,
    { title: en[0], body: { category, level, question: en[0], answer: en[1], ...(en[2] ? { can: en[2] } : {}), ...(en[3] ? { cannot: en[3] } : {}) } },
    { title: fr[0], body: { category, level, question: fr[0], answer: fr[1], ...(fr[2] ? { can: fr[2] } : {}), ...(fr[3] ? { cannot: fr[3] } : {}) } }));

// =============================================================== where to find first prospects
const SOURCES: [FindSourceBody["source"], [string, string, string, string?], [string, string, string, string?]][] = [
  ["network", ["Your personal network", "Family, friends, neighbours: who runs a business, or works in one?", "Write down 3 names.", "Start with people who already trust you: they will answer."],
    ["Votre réseau personnel", "Famille, amis, voisins : qui dirige une entreprise, ou y travaille ?", "Notez 3 noms.", "Commencez par ceux qui vous font déjà confiance : ils répondront."]],
  ["contacts", ["Your phone contacts", "Scroll through your contacts and WhatsApp groups: artisans, shops, coaches, therapists…", "Pick 3 people you could message today."],
    ["Les contacts de votre téléphone", "Faites défiler vos contacts et groupes WhatsApp : artisans, commerçants, coachs, thérapeutes…", "Choisissez 3 personnes à qui écrire aujourd’hui."]],
  ["professional", ["Your professional relations", "Colleagues, suppliers, clients of your own job, former employers.", "Find 3 businesses you have already worked with."],
    ["Vos relations professionnelles", "Collègues, fournisseurs, clients de votre propre métier, anciens employeurs.", "Trouvez 3 entreprises avec qui vous avez déjà travaillé."]],
  ["past_clients", ["Businesses you are a client of", "Your hairdresser, garage, restaurant, gym: you know them, they know you.", "List 3 places you go to regularly."],
    ["Les entreprises dont vous êtes client", "Votre coiffeur, garage, restaurant, salle de sport : vous les connaissez, ils vous connaissent.", "Listez 3 endroits où vous allez régulièrement."]],
  ["local", ["Local businesses", "Walk your street or search on maps for a sector of the copilot.", "Find 3 businesses whose website looks dated or absent.", "A dated website is not a reason to criticise — it’s a reason to ask a question."],
    ["Les entreprises locales", "Parcourez votre rue ou cherchez sur une carte un secteur du copilote.", "Trouvez 3 entreprises dont le site paraît daté ou absent.", "Un site daté n’est pas une raison de critiquer — c’est une raison de poser une question."]],
  ["linkedin", ["LinkedIn", "Search a sector + your city; look at owners and managers.", "Find 3 profiles and send a connection request without a pitch."],
    ["LinkedIn", "Cherchez un secteur + votre ville ; regardez les dirigeants et gérants.", "Trouvez 3 profils et envoyez une demande de connexion sans argumentaire."]],
  ["instagram", ["Instagram", "Search a hashtag of your sector + city: businesses that post but take requests by DM.", "Find 3 accounts and like or comment a recent post before writing."],
    ["Instagram", "Cherchez un hashtag de votre secteur + ville : des entreprises qui publient mais prennent les demandes en DM.", "Trouvez 3 comptes et aimez ou commentez un post récent avant d’écrire."]],
];
const findSources = SOURCES.flatMap(([source, en, fr], i) =>
  both("find_source", `find.${source}`, i,
    { title: en[0], body: { source, how: en[1], action: en[2], ...(en[3] ? { tip: en[3] } : {}) } },
    { title: fr[0], body: { source, how: fr[1], action: fr[2], ...(fr[3] ? { tip: fr[3] } : {}) } }));

export const guidedContent: SeedContent[] = [...stageGuides, ...hotelNew, ...replies, ...facts, ...findSources];
