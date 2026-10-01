/**
 * V0.4 ambassador copilot — starter content (seed + demo store). Every item is
 * a `public.sales_content` row: editable, versioned and translatable in
 * Admin → Sales content, like the V0.3 content.
 *
 * Positioning: Studio is not "a website" nor "a CRM" — Studio becomes the
 * client's digital team and infrastructure: it builds it, connects the tools,
 * runs it and helps the business grow.
 *
 * Rules: no statistics, no testimonials, no revenue or ROI claims, the price
 * is never negotiated by the ambassador.
 */
import type { BodyByKind, Channel, ContentKind, FunnelStage } from "../../lib/sales/content.ts";
import type { SeedContent } from "./content.ts";

interface Localised<K extends ContentKind> { title: string; summary?: string; tags?: string[]; body: BodyByKind[K] }
interface Meta { targetKey?: string; channel?: Channel; stage?: FunnelStage; sort?: number; tags?: string[] }

function both<K extends ContentKind>(kind: K, key: string, meta: Meta, en: Localised<K>, fr: Localised<K>): SeedContent[] {
  const { tags, ...rest } = meta;
  return [
    { kind, key, locale: "en", status: "active", ...rest, ...en, tags: en.tags ?? tags } as SeedContent,
    { kind, key, locale: "fr", status: "active", ...rest, ...fr, tags: fr.tags ?? tags } as SeedContent,
  ];
}

// =============================================================== understand Studio
const pitch = both("pitch", "studio", { sort: 0 },
  {
    title: "Studio in 15 seconds",
    summary: "What Studio is, for whom, and what the client really buys.",
    body: {
      oneLiner: "Studio becomes your digital team and infrastructure.",
      short: "Studio becomes the digital team of your business: we build your online presence, connect your tools, and run it for you — so you focus on your clients.",
      medium: "Most businesses juggle a website, social media, a booking tool, emails, spreadsheets — and nobody really owns it. Studio takes that over: we build your digital infrastructure, connect your tools so requests, clients and follow-ups live in one place, and we keep it running all year. You don’t buy a website, you get a team.",
      long: "Studio is a team that builds and runs the digital side of a business.\n\n1. We start from how you work today: how clients find you, contact you, buy, and how you follow them.\n2. We build what is missing — presentation, request forms, booking, shop, client space — and connect the tools you already use.\n3. We run it: hosting, security, backups, updates and changes, without you touching anything technical.\n\nThree levels depending on how much you want us to handle: Studio One (a ready-to-use presence you own), Studio Pro (a complete site maintained all year), Studio Premium (your whole commercial ecosystem — CRM, payments, automations — operated by Studio).",
      problem: "Small businesses pile up tools nobody maintains: a dated website, social accounts, a booking app, emails and spreadsheets. Requests get lost, follow-ups are forgotten, and every change depends on someone who isn’t there.",
      forWhom: "Independents, small businesses and growing companies that sell a service or a product and don’t have — or don’t want — an internal digital team.",
      whatTheyBuy: [
        "A team that builds and runs their digital side",
        "Their tools connected: requests, clients and follow-ups in one place",
        "Peace of mind: hosting, security, backups and updates handled",
        "Code and data they own",
      ],
      notThis: [
        "Not “just a website”",
        "Not “just a CRM”",
        "Not a pile of software subscriptions",
        "Not a promise of revenue — a team and an infrastructure",
      ],
    },
  },
  {
    title: "Studio en 15 secondes",
    summary: "Ce qu’est Studio, pour qui, et ce que le client achète vraiment.",
    body: {
      oneLiner: "Studio devient votre équipe et votre infrastructure numérique.",
      short: "Studio devient l’équipe numérique de votre entreprise : on construit votre présence en ligne, on connecte vos outils et on fait tout fonctionner pour vous — vous, vous vous occupez de vos clients.",
      medium: "La plupart des entreprises jonglent entre un site, des réseaux sociaux, un outil de réservation, des emails, des tableurs — et personne ne s’en occupe vraiment. Studio prend le relais : on construit votre infrastructure numérique, on connecte vos outils pour que demandes, clients et relances soient au même endroit, et on la fait fonctionner toute l’année. Vous n’achetez pas un site, vous gagnez une équipe.",
      long: "Studio est une équipe qui construit et fait fonctionner le numérique d’une entreprise.\n\n1. On part de votre fonctionnement actuel : comment les clients vous trouvent, vous contactent, achètent, et comment vous les suivez.\n2. On construit ce qui manque — présentation, formulaires de demande, réservation, boutique, espace client — et on connecte les outils que vous utilisez déjà.\n3. On fait tourner le tout : hébergement, sécurité, sauvegardes, mises à jour et modifications, sans que vous touchiez à la technique.\n\nTrois niveaux selon ce que vous voulez nous confier : Studio One (une présence prête à l’emploi qui vous appartient), Studio Pro (un site complet maintenu toute l’année), Studio Premium (tout votre écosystème commercial — CRM, paiements, automatisations — opéré par Studio).",
      problem: "Les petites entreprises empilent des outils que personne ne maintient : un site daté, des comptes sociaux, une appli de réservation, des emails et des tableurs. Des demandes se perdent, les relances sont oubliées, et chaque changement dépend de quelqu’un qui n’est pas là.",
      forWhom: "Indépendants, petites entreprises et sociétés en croissance qui vendent un service ou un produit et qui n’ont pas — ou ne veulent pas — d’équipe numérique interne.",
      whatTheyBuy: [
        "Une équipe qui construit et fait fonctionner leur numérique",
        "Leurs outils connectés : demandes, clients et relances au même endroit",
        "La tranquillité : hébergement, sécurité, sauvegardes et mises à jour gérés",
        "Un code et des données qui leur appartiennent",
      ],
      notThis: [
        "Pas « juste un site »",
        "Pas « juste un CRM »",
        "Pas une pile d’abonnements logiciels",
        "Pas une promesse de chiffre d’affaires — une équipe et une infrastructure",
      ],
    },
  });

// =============================================================== diagnostic questions
const diagnostic = both("diagnostic", "core", { sort: 0 },
  {
    title: "7 questions to guide the conversation",
    summary: "Ask, listen, and note the answers in the prospect’s card.",
    body: {
      intro: "You don’t need to know the technique. Ask one question at a time and let them talk: every answer tells you what Studio can take off their hands.",
      questions: [
        { question: "How do you manage your prospects today?", listenFor: "Memory, notebook, phone contacts, scattered emails.", studio: "Every request and contact in one place, with history." },
        { question: "How do you follow up with people who haven’t answered?", listenFor: "“I don’t”, “when I have time”, “I forget”.", studio: "Follow-ups planned and prepared, so none is forgotten." },
        { question: "Who manages your website and digital tools?", listenFor: "A nephew, a freelancer who left, “nobody”, “me, at night”.", studio: "A team that builds, hosts, secures and updates everything." },
        { question: "How many different tools do you use for your clients?", listenFor: "Several apps, subscriptions, spreadsheets that don’t talk to each other.", studio: "Tools connected — or replaced — in one infrastructure." },
        { question: "What happens when a prospect contacts you?", listenFor: "Missed calls, DMs answered days later, requests without details.", studio: "Requests that arrive complete, and an answer path that works even when they’re busy." },
        { question: "How do you keep track of your clients after a sale?", listenFor: "No follow-up, no news, no second sale.", studio: "Client history and follow-ups that bring them back." },
        { question: "What makes you lose the most time today?", listenFor: "Admin, repetitive questions, re-typing, chasing information.", studio: "Automate the repetitive part — they keep the human part." },
        { question: "Where can a new enquiry arrive today?", listenFor: "Phone, email, DMs and forms monitored by different people.", studio: "Bring requests into one visible flow." },
        { question: "Who owns the next action after an enquiry?", listenFor: "No named owner, shared inbox, or the founder does everything.", studio: "Give each opportunity an owner, stage and next action." },
        { question: "What information is usually missing before the first call?", listenFor: "Budget, timing, service, location or decision-maker.", studio: "Collect useful context before the conversation." },
        { question: "What happens when you are unavailable for a day?", listenFor: "Requests wait, appointments stop, nobody has access.", studio: "Keep safe next steps working without the owner." },
        { question: "Which customer question do you answer every week?", listenFor: "Prices, availability, process, documents or opening hours.", studio: "Put reliable answers at the right point in the journey." },
        { question: "How are appointments arranged and confirmed?", listenFor: "Back-and-forth messages, double booking, forgotten reminders.", studio: "Connect booking, confirmations and reminders when relevant." },
        { question: "How do you know which channel brought a customer?", listenFor: "Guesswork, no source field, inconsistent tracking.", studio: "Track useful sources and campaigns." },
        { question: "What do you copy from one tool into another?", listenFor: "Repeated entry between forms, email, spreadsheets, CRM and invoices.", studio: "Connect the flow and remove avoidable re-entry." },
        { question: "Who updates your online information when something changes?", listenFor: "Nobody, an unavailable freelancer, several inconsistent places.", studio: "Create a maintainable source with an operating owner." },
        { question: "How do you know a prospect has gone cold?", listenFor: "Memory, inbox searching, no agreed follow-up cadence.", studio: "Make inactivity and the next follow-up visible." },
        { question: "Which part of the customer journey causes the most errors?", listenFor: "Handoffs, missing information, manual confirmation or payment status.", studio: "Redesign the weak handoff before adding technology." },
        { question: "What have you already tried to fix this?", listenFor: "Unused tools, partial setup, abandoned project, training without ownership.", studio: "Preserve what works and take responsibility for the missing system." },
        { question: "What would a good result look like in daily work?", listenFor: "Less repetition, clearer status, faster response, fewer lost requests.", studio: "Define an operational outcome without promising revenue." },
      ],
    },
  },
  {
    title: "7 questions pour guider la conversation",
    summary: "Posez, écoutez, et notez les réponses dans la fiche du prospect.",
    body: {
      intro: "Pas besoin de connaître la technique. Posez une question à la fois et laissez parler : chaque réponse vous dit ce que Studio peut leur enlever.",
      questions: [
        { question: "Comment gérez-vous actuellement vos prospects ?", listenFor: "De tête, un carnet, les contacts du téléphone, des emails éparpillés.", studio: "Toutes les demandes et contacts au même endroit, avec l’historique." },
        { question: "Comment effectuez-vous vos relances ?", listenFor: "« Je n’en fais pas », « quand j’ai le temps », « j’oublie ».", studio: "Des relances planifiées et préparées, aucune n’est oubliée." },
        { question: "Qui gère votre infrastructure numérique ?", listenFor: "Un neveu, un freelance parti, « personne », « moi, le soir ».", studio: "Une équipe qui construit, héberge, sécurise et met tout à jour." },
        { question: "Combien d’outils différents utilisez-vous ?", listenFor: "Plusieurs applis, abonnements et tableurs qui ne se parlent pas.", studio: "Des outils connectés — ou remplacés — dans une seule infrastructure." },
        { question: "Que se passe-t-il lorsqu’un prospect vous contacte ?", listenFor: "Appels manqués, DM répondus des jours plus tard, demandes sans détails.", studio: "Des demandes complètes et un parcours de réponse qui fonctionne même quand ils sont occupés." },
        { question: "Comment suivez-vous vos clients ?", listenFor: "Aucun suivi, pas de nouvelles, pas de deuxième vente.", studio: "Un historique client et des relances qui les font revenir." },
        { question: "Qu’est-ce qui vous fait perdre du temps actuellement ?", listenFor: "Administratif, questions répétitives, ressaisies, informations à aller chercher.", studio: "Automatiser le répétitif — ils gardent la partie humaine." },
        { question: "Où une nouvelle demande peut-elle arriver aujourd’hui ?", listenFor: "Téléphone, email, DM et formulaires surveillés par des personnes différentes.", studio: "Réunir les demandes dans un parcours visible." },
        { question: "Qui porte la prochaine action après une demande ?", listenFor: "Aucun responsable nommé, boîte partagée, ou le dirigeant fait tout.", studio: "Donner à chaque opportunité un responsable, une étape et une prochaine action." },
        { question: "Quelle information manque le plus souvent avant le premier appel ?", listenFor: "Budget, délai, service, localisation ou décideur.", studio: "Recueillir le contexte utile avant la conversation." },
        { question: "Que se passe-t-il si vous êtes indisponible une journée ?", listenFor: "Les demandes attendent, les rendez-vous s’arrêtent, personne n’a accès.", studio: "Maintenir les prochaines étapes sûres sans dépendre du dirigeant." },
        { question: "À quelle question client répondez-vous chaque semaine ?", listenFor: "Prix, disponibilité, processus, documents ou horaires.", studio: "Placer les réponses fiables au bon endroit dans le parcours." },
        { question: "Comment les rendez-vous sont-ils organisés et confirmés ?", listenFor: "Allers-retours de messages, doublons, rappels oubliés.", studio: "Relier réservation, confirmations et rappels lorsque c’est pertinent." },
        { question: "Comment savez-vous quel canal a apporté un client ?", listenFor: "Intuition, aucune source enregistrée, suivi incohérent.", studio: "Suivre les sources et campagnes utiles." },
        { question: "Que recopiez-vous d’un outil dans un autre ?", listenFor: "Saisies répétées entre formulaires, email, tableurs, CRM et factures.", studio: "Connecter le parcours et supprimer les ressaisies évitables." },
        { question: "Qui met à jour vos informations en ligne lorsqu’elles changent ?", listenFor: "Personne, un prestataire indisponible, plusieurs endroits incohérents.", studio: "Créer une source maintenable avec un responsable opérationnel." },
        { question: "Comment savez-vous qu’un prospect s’est refroidi ?", listenFor: "Mémoire, recherche dans la boîte mail, aucune cadence de relance convenue.", studio: "Rendre visibles l’inactivité et la prochaine relance." },
        { question: "Quelle étape du parcours client provoque le plus d’erreurs ?", listenFor: "Passage de relais, information manquante, confirmation manuelle ou statut de paiement.", studio: "Repenser le passage fragile avant d’ajouter de la technologie." },
        { question: "Qu’avez-vous déjà essayé pour résoudre ce problème ?", listenFor: "Outils inutilisés, configuration partielle, projet abandonné, formation sans responsable.", studio: "Conserver ce qui fonctionne et prendre en charge le système manquant." },
        { question: "À quoi ressemblerait un bon résultat dans votre quotidien ?", listenFor: "Moins de répétition, statut plus clair, réponse plus rapide, moins de demandes perdues.", studio: "Définir un résultat opérationnel sans promettre de chiffre d’affaires." },
      ],
    },
  });

// =============================================================== follow-up sequences (CRM)
const sequences = [
  ...both("sequence", "no-reply", { stage: "follow_up", sort: 0 },
    {
      title: "No reply after the first message",
      summary: "Five touches over a month, then stop.",
      body: {
        intro: "Applies to prospects in “Contacted”. One short touch at a time — never insist after J+30.",
        steps: [
          { day: 1, channel: "linkedin", goal: "Soft touch", text: "Hello {{firstName}}, I sent you a short message yesterday about {{company}} — no rush, I’m around if the question speaks to you." },
          { day: 3, channel: "whatsapp", goal: "Short reminder", text: "Hello {{firstName}}, I’m bringing my message back up: how do new clients reach {{company}} today? If it’s not a topic for you, just tell me." },
          { day: 7, channel: "email", goal: "Bring value: show a similar project", text: "Hello {{firstName}}, here is an example of what Studio built for a business close to yours — it shows in one minute what I meant: {{affiliateUrl}}" },
          { day: 14, channel: "other", goal: "One direct question", text: "Hello {{firstName}}, one simple question and I’ll stop there: is organising your requests and follow-ups a topic for you this year, yes or no?" },
          { day: 30, channel: "email", goal: "Close the loop", text: "Hello {{firstName}}, I won’t follow up again — I don’t want to clutter your inbox. If one day you want a team to handle the digital side of {{company}}, everything is here: {{affiliateUrl}}" },
        ],
      },
    },
    {
      title: "Pas de réponse après le premier message",
      summary: "Cinq relances sur un mois, puis on s’arrête.",
      body: {
        intro: "S’applique aux prospects « Contactés ». Une relance courte à la fois — on n’insiste jamais après J+30.",
        steps: [
          { day: 1, channel: "linkedin", goal: "Contact léger", text: "Bonjour {{firstName}}, je vous ai envoyé un petit message hier au sujet de {{company}} — rien d’urgent, je reste disponible si la question vous parle." },
          { day: 3, channel: "whatsapp", goal: "Relance courte", text: "Bonjour {{firstName}}, je remonte mon message : comment les nouveaux clients contactent-ils {{company}} aujourd’hui ? Si ce n’est pas un sujet pour vous, dites-le-moi simplement." },
          { day: 7, channel: "email", goal: "Apporter de la valeur : montrer un projet proche", text: "Bonjour {{firstName}}, voici un exemple de ce que Studio a réalisé pour une activité proche de la vôtre — ça montre en une minute ce que je voulais dire : {{affiliateUrl}}" },
          { day: 14, channel: "other", goal: "Une question directe", text: "Bonjour {{firstName}}, une question simple et je m’arrête là : organiser vos demandes et vos relances, c’est un sujet pour vous cette année, oui ou non ?" },
          { day: 30, channel: "email", goal: "Clore proprement", text: "Bonjour {{firstName}}, je ne vous relancerai plus — je ne veux pas encombrer votre boîte. Si un jour vous voulez une équipe pour gérer le numérique de {{company}}, tout est ici : {{affiliateUrl}}" },
        ],
      },
    }),
  ...both("sequence", "after-proposal", { stage: "proposal", sort: 1 },
    {
      title: "After sending the offer",
      summary: "Help them decide without pressure.",
      body: {
        intro: "Applies to prospects in “Proposal” or “Checkout”. You answer questions; you never negotiate the price.",
        steps: [
          { day: 1, channel: "whatsapp", goal: "Check it arrived", text: "Hello {{firstName}}, did you get the Studio offer? Any first question, even a small one?" },
          { day: 3, channel: "phone", goal: "Offer a 10-minute call", text: "Hello {{firstName}}, would 10 minutes this week help to go over the offer together? I can answer what’s still unclear." },
          { day: 7, channel: "email", goal: "Answer the usual doubt", text: "Hello {{firstName}}, people often ask me the same question at this stage: what exactly Studio handles after the launch. Short answer: hosting, security, backups and changes — you don’t touch anything technical. Shall we talk about it?" },
          { day: 14, channel: "other", goal: "Ask for a decision", text: "Hello {{firstName}}, where are you on Studio for {{company}}? A “not now” is a perfectly fine answer — it helps me know when to come back." },
        ],
      },
    },
    {
      title: "Après l’envoi de l’offre",
      summary: "Aider à décider, sans pression.",
      body: {
        intro: "S’applique aux prospects en « Proposition » ou « Paiement ». Vous répondez aux questions ; vous ne négociez jamais le prix.",
        steps: [
          { day: 1, channel: "whatsapp", goal: "Vérifier la réception", text: "Bonjour {{firstName}}, vous avez bien reçu l’offre Studio ? Une première question, même petite ?" },
          { day: 3, channel: "phone", goal: "Proposer 10 minutes d’appel", text: "Bonjour {{firstName}}, 10 minutes cette semaine pour parcourir l’offre ensemble, ça vous aiderait ? Je peux répondre à ce qui reste flou." },
          { day: 7, channel: "email", goal: "Lever le doute habituel", text: "Bonjour {{firstName}}, on me pose souvent la même question à ce stade : ce que Studio gère exactement après la mise en ligne. Réponse courte : hébergement, sécurité, sauvegardes et modifications — vous ne touchez à rien de technique. On en parle ?" },
          { day: 14, channel: "other", goal: "Demander une décision", text: "Bonjour {{firstName}}, où en êtes-vous pour Studio chez {{company}} ? Un « pas maintenant » est une très bonne réponse — ça m’aide à savoir quand revenir vers vous." },
        ],
      },
    }),
];

// =============================================================== messages (ready to copy)
type Msg = [key: string, stage: FunnelStage, channel: Channel, tags: string[], enTitle: string, en: string, frTitle: string, fr: string];
const MESSAGES: Msg[] = [
  ["first-contact-instagram", "first_contact", "instagram", ["instagram", "dm", "ton:chaleureux"],
    "First contact — Instagram DM",
    "Hello {{firstName}}! I really like what you post for {{company}} 👏 Quick question: when someone wants to work with you after seeing a post, how do they contact you? I work with Studio, a team that builds and runs the digital side of businesses like yours. Happy to show you an example if you’re curious.",
    "Premier contact — DM Instagram",
    "Bonjour {{firstName}} ! J’aime beaucoup ce que vous publiez pour {{company}} 👏 Petite question : quand quelqu’un veut travailler avec vous après avoir vu un post, comment vous contacte-t-il ? Je travaille avec Studio, une équipe qui construit et fait fonctionner le numérique d’entreprises comme la vôtre. Je peux vous montrer un exemple si ça vous intrigue."],
  ["first-contact-direct", "first_contact", "other", ["ton:direct", "premier contact"],
    "First contact — direct tone",
    "Hello {{firstName}}, I’m {{advisorName}}. I work with Studio, which becomes the digital team of businesses: website, tools, requests and follow-ups built and run for them. For {{company}}, I think there’s a quick win. 10 minutes this week?",
    "Premier contact — ton direct",
    "Bonjour {{firstName}}, je suis {{advisorName}}. Je travaille avec Studio, qui devient l’équipe numérique des entreprises : site, outils, demandes et relances construits et gérés pour elles. Pour {{company}}, je pense qu’il y a quelque chose de simple à gagner. 10 minutes cette semaine ?"],
  ["first-contact-warm", "first_contact", "other", ["ton:chaleureux", "premier contact", "réseau"],
    "First contact — warm tone (someone you know)",
    "Hi {{firstName}}, how are you? I’ve started working with Studio, a team that handles the whole digital side of businesses — site, tools, requests, follow-ups. I immediately thought of {{company}}. Can I tell you about it over a coffee or a quick call?",
    "Premier contact — ton chaleureux (quelqu’un que vous connaissez)",
    "Salut {{firstName}}, comment vas-tu ? J’ai commencé à travailler avec Studio, une équipe qui prend en charge tout le numérique des entreprises — site, outils, demandes, relances. J’ai tout de suite pensé à {{company}}. Je t’en parle autour d’un café ou d’un appel rapide ?"],
  ["interested-reply", "interested", "other", ["intérêt", "interested"],
    "Reply after interest",
    "Great, thank you {{firstName}}! To show you something relevant rather than a generic presentation, I have two questions: how do new clients contact you today, and who manages your tools? Then I’ll send you a concrete example close to {{company}}.",
    "Réponse après un intérêt",
    "Super, merci {{firstName}} ! Pour vous montrer quelque chose de pertinent plutôt qu’une présentation générique, j’ai deux questions : comment les nouveaux clients vous contactent-ils aujourd’hui, et qui gère vos outils ? Ensuite je vous envoie un exemple concret proche de {{company}}."],
  ["meeting-proposal", "interested", "other", ["rendez-vous", "meeting", "appel"],
    "Propose a meeting",
    "{{firstName}}, the simplest is to look at it together: 20 minutes, I show you a project close to {{company}} and we see what Studio could take off your hands. Would Tuesday or Thursday suit you, morning or afternoon?",
    "Proposition de rendez-vous",
    "{{firstName}}, le plus simple est de regarder ensemble : 20 minutes, je vous montre un projet proche de {{company}} et on voit ce que Studio pourrait vous enlever. Mardi ou jeudi, plutôt matin ou après-midi ?"],
  ["share-reference", "follow_up", "other", ["référence", "projet", "exemple"],
    "Share a similar project",
    "Hello {{firstName}}, here is a project Studio built for a business close to yours — take a look on your phone, it speaks for itself. I can explain how the same thing would work for {{company}}: {{affiliateUrl}}",
    "Partager un projet proche",
    "Bonjour {{firstName}}, voici un projet réalisé par Studio pour une activité proche de la vôtre — regardez-le sur votre téléphone, il parle de lui-même. Je peux vous expliquer comment la même chose fonctionnerait pour {{company}} : {{affiliateUrl}}"],
  ["silence-revive", "no_response", "email", ["silence", "relance", "réactiver"],
    "Revive after a long silence",
    "Hello {{firstName}}, we talked a while ago about the digital side of {{company}}. A lot of businesses come back to the topic before a busy season — is it a better time now? If not, no problem at all.",
    "Relance après un long silence",
    "Bonjour {{firstName}}, nous avions échangé il y a quelque temps sur le numérique de {{company}}. Beaucoup d’entreprises reviennent sur le sujet avant une période chargée — est-ce un meilleur moment maintenant ? Sinon, aucun souci."],
];
const messages = MESSAGES.flatMap(([key, stage, channel, tags, enTitle, en, frTitle, fr], i) =>
  both("message", key, { stage, channel, tags, sort: 60 + i }, { title: enTitle, body: { text: en } }, { title: frTitle, body: { text: fr } }));

// =============================================================== objections
type Obj = [key: string, tags: string[], en: [string, string, string[], string, string, string, string?], fr: [string, string, string[], string, string, string, string?]];
const OBJECTIONS: Obj[] = [
  ["already-crm", ["crm", "hubspot", "salesforce", "pipedrive", "outil", "logiciel", "software"],
    ["“I already have a CRM.”", "They think Studio is one more piece of software.",
      ["Who set it up, and who keeps it up to date?", "Is it connected to your website and your requests?"],
      "Great — Studio isn’t one more tool: it’s the team that connects your tools and keeps them working together.",
      "A CRM is only as good as what feeds it. Often, requests from the website, social media and phone never reach it, and nobody has time to maintain it. Studio starts from what you already use: we connect it, fill the gaps around it and run the whole thing. If your CRM is right for you, we keep it.",
      "Ask which tools they use, and note them in the prospect card for the Studio team.",
      "Show a project where requests and follow-ups are centralised."],
    ["« J’ai déjà un CRM. »", "Ils pensent que Studio est un logiciel de plus.",
      ["Qui l’a mis en place, et qui le tient à jour ?", "Est-il relié à votre site et à vos demandes ?"],
      "Très bien — Studio n’est pas un outil de plus : c’est l’équipe qui connecte vos outils et les fait fonctionner ensemble.",
      "Un CRM ne vaut que par ce qui l’alimente. Souvent, les demandes du site, des réseaux et du téléphone n’y arrivent jamais, et personne n’a le temps de le maintenir. Studio part de ce que vous utilisez déjà : on le connecte, on complète ce qui manque autour et on fait tourner l’ensemble. Si votre CRM vous convient, on le garde.",
      "Demandez quels outils ils utilisent et notez-les dans la fiche prospect pour l’équipe Studio.",
      "Montrez un projet où demandes et relances sont centralisées."]],
  ["do-it-myself", ["moi-même", "myself", "wix", "wordpress", "squarespace", "diy", "neveu"],
    ["“I can do it myself.”", "They can build pages — and underestimate what comes after.",
      ["How much time would you spend on it each month?", "Who handles it when something breaks or needs changing?"],
      "You could build a site, yes. Studio is about everything after: running it, connecting it, securing it — while you work on your business.",
      "Building a page is the easy part. What takes time is everything around it: connecting the tools, keeping it secure, backups, updates, changes, follow-ups that go out on time. Studio is a team that handles that all year. The real question is: is it the best use of your time?",
      "Ask what their hour is worth to them, and compare with the offer — never negotiate the price."],
    ["« Je peux le faire moi-même. »", "Ils savent faire des pages — et sous-estiment ce qui vient après.",
      ["Combien de temps y passeriez-vous chaque mois ?", "Qui s’en occupe quand quelque chose casse ou doit changer ?"],
      "Vous pourriez faire un site, oui. Studio, c’est tout ce qui vient après : le faire fonctionner, le connecter, le sécuriser — pendant que vous travaillez sur votre activité.",
      "Faire une page, c’est la partie facile. Ce qui prend du temps, c’est tout le reste : connecter les outils, sécuriser, sauvegarder, mettre à jour, modifier, envoyer les relances à temps. Studio est une équipe qui gère cela toute l’année. La vraie question : est-ce le meilleur usage de votre temps ?",
      "Demandez ce que vaut une heure de leur temps et comparez avec l’offre — sans jamais négocier le prix."]],
  ["dont-understand", ["comprends pas", "understand", "c’est quoi", "what is", "flou", "unclear"],
    ["“I don’t understand exactly what you do.”", "The pitch was too abstract — bring it back to their day.",
      ["Can I ask how a new client reaches you today?", "Which part of your digital side annoys you the most?"],
      "Simply: we become your digital team. We build your online presence, connect your tools and run everything for you.",
      "Forget the technical words. Think of an employee in charge of everything digital: the site, requests, follow-ups, tools, security. Studio is that team, for a fixed price, without hiring. Then show one concrete project close to their business — it’s always clearer than an explanation.",
      "Send one similar project from the copilot, then propose 20 minutes.",
      "Show the closest project from the copilot."],
    ["« Je ne comprends pas exactement ce que vous faites. »", "Le pitch était trop abstrait — ramenez-le à leur quotidien.",
      ["Je peux vous demander comment un nouveau client vous contacte aujourd’hui ?", "Quelle partie de votre numérique vous agace le plus ?"],
      "Simplement : on devient votre équipe numérique. On construit votre présence en ligne, on connecte vos outils et on fait tout fonctionner pour vous.",
      "Oubliez les mots techniques. Imaginez un salarié en charge de tout le numérique : le site, les demandes, les relances, les outils, la sécurité. Studio, c’est cette équipe, à prix fixe, sans recruter. Ensuite montrez un projet concret proche de leur activité — c’est toujours plus clair qu’une explication.",
      "Envoyez un projet proche depuis le copilote, puis proposez 20 minutes.",
      "Montrez le projet le plus proche trouvé dans le copilote."]],
];
const objections = OBJECTIONS.flatMap(([key, tags, en, fr], i) =>
  both("objection", key, { stage: "objection", tags, sort: 80 + i },
    { title: en[0], body: { objection: en[0], meaning: en[1], questions: en[2], short: en[3], long: en[4], nextStep: en[5], ...(en[6] ? { proof: en[6] } : {}) } },
    { title: fr[0], body: { objection: fr[0], meaning: fr[1], questions: fr[2], short: fr[3], long: fr[4], nextStep: fr[5], ...(fr[6] ? { proof: fr[6] } : {}) } }));

export const copilotContent: SeedContent[] = [...pitch, ...diagnostic, ...sequences, ...messages, ...objections];
