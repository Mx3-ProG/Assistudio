/**
 * Sales Center starter content (seed + demo store). Every item becomes a row
 * of `public.sales_content`, editable and versioned in Admin → Sales content.
 *
 * Sources: the existing Studio ATS copy (dictionary `studio.*`), the V0.1 sales
 * kit and the V0.3 brief (problem → solution → value → features → benefits →
 * target → objections → sales language). Nothing here is a promise of results:
 * no statistics, no testimonials, no revenue claims. Sections that need facts
 * only Studio ATS can confirm (what's NOT included, limitations) are seeded as
 * DRAFTS so affiliates never see unverified statements.
 *
 * Placeholders: {{firstName}} {{company}} {{sector}} {{advisorName}}
 * {{affiliateUrl}} {{campaign}} — see src/lib/sales/personalize.ts.
 */
import type { BodyByKind, Channel, ContentKind, FunnelStage } from "../../lib/sales/content.ts";

export interface SeedContent<K extends ContentKind = ContentKind> {
  kind: K;
  key: string;
  locale: "en" | "fr";
  status: "active" | "draft";
  title: string;
  summary?: string;
  targetKey?: string;
  channel?: Channel;
  stage?: FunnelStage;
  tags?: string[];
  sort?: number;
  body: BodyByKind[K];
}

interface Localised<K extends ContentKind> { title: string; summary?: string; tags?: string[]; body: BodyByKind[K] }
interface Meta { targetKey?: string; channel?: Channel; stage?: FunnelStage; sort?: number; status?: "active" | "draft" }

function both<K extends ContentKind>(kind: K, key: string, meta: Meta, en: Localised<K>, fr: Localised<K>): SeedContent[] {
  const { status = "active", ...rest } = meta;
  return [
    { kind, key, locale: "en", status, ...rest, ...en } as SeedContent,
    { kind, key, locale: "fr", status, ...rest, ...fr } as SeedContent,
  ];
}

// =============================================================== landing pages
const template = both("page_template", "studio-default", { sort: 0 },
  {
    title: "Studio ATS — standard sales page",
    summary: "Default structure for every affiliate sales page.",
    body: {
      ctaModes: ["buy", "lead", "call", "quote", "question"],
      defaultCta: "lead",
      sections: ["hero", "problem", "solution", "value", "how", "benefits", "included", "who", "faq", "offer", "cta"],
      heroTitle: "Turn your traffic into opportunities.",
      heroSubtitle: "An online commercial studio for professionals whose every new client has real value. Present your work, qualify requests and book appointments — in one place.",
      problemTitle: "Great work. Lost requests.",
      problemBody: "Enquiries arrive through a contact form, social media, messages and email. Nobody knows which ones are serious, follow-ups are forgotten, and good prospects go cold.",
      solutionTitle: "More than a website.",
      solutionBody: "The site is only one part. Studio ATS is the whole path from first visit to booked appointment — designed, set up and maintained for you.",
      valueTitle: "What you actually get",
      valueItems: [
        "A presence that inspires trust at first glance",
        "Requests that arrive with the right information",
        "Every contact and request in one place",
        "Follow-ups that go out on time",
      ],
      howTitle: "How it works",
      howSteps: [
        { title: "Request", body: "Tell us about your business in a short form." },
        { title: "Call", body: "We qualify your needs together." },
        { title: "Build", body: "We design and configure your Studio ATS." },
        { title: "Launch", body: "You start receiving structured requests." },
      ],
      benefitsTitle: "Why it matters for your business",
      benefits: [
        { title: "Trust", body: "Prospects check you online before calling. Make that first impression count." },
        { title: "Time", body: "Know budget, timing and project type before you pick up the phone." },
        { title: "Nothing to manage", body: "Built, hosted and maintained by the Studio ATS team." },
      ],
      includedTitle: "What’s included",
      whoTitle: "Who it’s for",
      whoBody: "Professionals and companies whose clients are worth a lot, with a visual or premium offer and inbound requests to convert.",
      faqTitle: "Questions you may have",
      offerTitle: "One plan. Everything included.",
      offerNote: "Price excl. VAT where applicable. Final terms in the contract.",
      ctaTitle: "Ready to talk about your business?",
      ctaBody: "Leave your details — no commitment. We’ll get back to you to understand your needs.",
    },
  },
  {
    title: "Studio ATS — page commerciale standard",
    summary: "Structure par défaut de toutes les pages commerciales affiliées.",
    body: {
      ctaModes: ["buy", "lead", "call", "quote", "question"],
      defaultCta: "lead",
      sections: ["hero", "problem", "solution", "value", "how", "benefits", "included", "who", "faq", "offer", "cta"],
      heroTitle: "Transformez votre trafic en opportunités.",
      heroSubtitle: "Un studio commercial en ligne pour les professionnels dont chaque nouveau client compte. Présentez votre travail, qualifiez les demandes et obtenez des rendez-vous — au même endroit.",
      problemTitle: "Un beau travail. Des demandes perdues.",
      problemBody: "Les demandes arrivent par formulaire, réseaux sociaux, messages et email. Personne ne sait lesquelles sont sérieuses, les relances sont oubliées et les bons prospects refroidissent.",
      solutionTitle: "Bien plus qu’un site.",
      solutionBody: "Le site n’est qu’une partie. Studio ATS, c’est tout le parcours, de la première visite au rendez-vous — conçu, mis en place et maintenu pour vous.",
      valueTitle: "Ce que vous obtenez vraiment",
      valueItems: [
        "Une présence qui inspire confiance au premier regard",
        "Des demandes qui arrivent avec les bonnes informations",
        "Tous les contacts et demandes au même endroit",
        "Des relances envoyées au bon moment",
      ],
      howTitle: "Comment ça marche",
      howSteps: [
        { title: "Demande", body: "Présentez votre activité dans un court formulaire." },
        { title: "Appel", body: "Nous qualifions ensemble vos besoins." },
        { title: "Création", body: "Nous concevons et configurons votre Studio ATS." },
        { title: "Lancement", body: "Vous recevez des demandes structurées." },
      ],
      benefitsTitle: "Pourquoi c’est important pour votre activité",
      benefits: [
        { title: "Confiance", body: "Les prospects vous vérifient en ligne avant d’appeler. Soignez cette première impression." },
        { title: "Temps", body: "Connaissez budget, délai et type de projet avant de décrocher." },
        { title: "Rien à gérer", body: "Conçu, hébergé et maintenu par l’équipe Studio ATS." },
      ],
      includedTitle: "Ce qui est inclus",
      whoTitle: "Pour qui",
      whoBody: "Les professionnels et entreprises dont chaque client compte, avec une offre visuelle ou premium et des demandes entrantes à convertir.",
      faqTitle: "Vos questions",
      offerTitle: "Une formule. Tout inclus.",
      offerNote: "Prix HT le cas échéant. Conditions définitives au contrat.",
      ctaTitle: "Prêt à parler de votre activité ?",
      ctaBody: "Laissez vos coordonnées — sans engagement. Nous revenons vers vous pour comprendre vos besoins.",
    },
  });

const variants = both("page_variant", "studio-default.artisans", { targetKey: "artisans" },
  {
    title: "Artisans variant",
    body: {
      template: "studio-default",
      heroTitle: "Your work is excellent. Your online presence should be too.",
      heroSubtitle: "Prospects look you up before they call. Studio ATS gives your business a professional presence and collects complete requests — even while you’re on a job.",
      problemTitle: "Word of mouth isn’t enough anymore.",
      problemBody: "People who don’t know you yet check you online first. If they find little, they call someone else — and the requests that do arrive are scattered and incomplete.",
      ctaTitle: "Let’s look at your business together",
      ctaBody: "Leave your details and describe your trade in one line. No commitment.",
    },
  },
  {
    title: "Variante artisans",
    body: {
      template: "studio-default",
      heroTitle: "Votre travail est excellent. Votre présence en ligne doit l’être aussi.",
      heroSubtitle: "Les prospects vous cherchent avant d’appeler. Studio ATS donne à votre entreprise une présence professionnelle et recueille des demandes complètes — même pendant vos chantiers.",
      problemTitle: "Le bouche-à-oreille ne suffit plus.",
      problemBody: "Ceux qui ne vous connaissent pas encore vous vérifient d’abord en ligne. S’ils trouvent peu de choses, ils appellent quelqu’un d’autre — et les demandes qui arrivent sont éparpillées et incomplètes.",
      ctaTitle: "Regardons ensemble votre activité",
      ctaBody: "Laissez vos coordonnées et décrivez votre métier en une ligne. Sans engagement.",
    },
  });

const angles = [
  ...both("sales_angle", "qualified-inquiries", { sort: 1 },
    { title: "Generate more qualified inquiries", body: { promise: "Requests that arrive with budget, timing and details.", heroTitle: "Receive requests you can actually answer.", heroSubtitle: "Studio ATS asks the right questions before the first call, so every request arrives with the information you need." } },
    { title: "Recevoir des demandes plus qualifiées", body: { promise: "Des demandes qui arrivent avec budget, délai et détails.", heroTitle: "Recevez des demandes auxquelles vous pouvez vraiment répondre.", heroSubtitle: "Studio ATS pose les bonnes questions avant le premier appel : chaque demande arrive avec les informations dont vous avez besoin." } }),
  ...both("sales_angle", "professional-presence", { sort: 2 },
    { title: "Look as professional online as you are", body: { promise: "A presence that matches the quality of the work.", heroTitle: "Look as professional online as you are in real life.", heroSubtitle: "Prospects check you before they call. Give them a presence that inspires trust in seconds." } },
    { title: "Paraître aussi professionnel en ligne qu’en vrai", body: { promise: "Une présence à la hauteur de la qualité du travail.", heroTitle: "Soyez aussi professionnel en ligne que dans la réalité.", heroSubtitle: "Les prospects vous vérifient avant d’appeler. Offrez-leur une présence qui inspire confiance en quelques secondes." } }),
  ...both("sales_angle", "never-miss-request", { sort: 3 },
    { title: "Stop losing requests", body: { promise: "Every request captured and centralised, even while busy.", heroTitle: "Stop losing requests while you work.", heroSubtitle: "Every request lands in one place with the right details — and follow-ups go out on time." } },
    { title: "Ne plus perdre de demandes", body: { promise: "Chaque demande captée et centralisée, même quand on est occupé.", heroTitle: "Ne perdez plus de demandes pendant que vous travaillez.", heroSubtitle: "Chaque demande arrive au même endroit avec les bons détails — et les relances partent au bon moment." } }),
];

// =============================================================== playbooks
const playbooks = [
  ...both("playbook", "generic", { sort: 10 },
    {
      title: "Sell Studio ATS — the method",
      summary: "The 10 steps of a Studio ATS sale, for any target. Open a target to get its problems and angle injected.",
      tags: ["method", "discovery", "closing"],
      body: {
        intro: "Sell the outcome, not the technology. Your job is to understand their situation, show them what they lose today, and send them the right page.",
        steps: [
          { key: "understand", title: "Understand them", body: "Before contacting, look at how they present themselves online today and how a new client can reach them.", bullets: ["Check their site, social profiles and reviews", "Note one specific thing you like about their work"] },
          { key: "opening", title: "Opening", body: "Start with them, not with Studio ATS. One genuine remark, one question.", bullets: ["“I came across your work on …”", "“Quick question: how do most new clients find you?”"] },
          { key: "discovery", title: "Discovery", body: "Ask, then listen. Let them describe how requests arrive and what happens next.", bullets: ["How do new clients contact you today?", "What information is usually missing?", "What happens when you can’t answer immediately?"] },
          { key: "pain", title: "Identify the pain", body: "Name the problem with their words. Don’t invent one they don’t have." },
          { key: "present", title: "Present Studio ATS", body: "Connect Studio ATS to the problem they just described — one sentence, not a feature list.", bullets: ["“That’s exactly what Studio ATS handles: …”"] },
          { key: "value", title: "Demonstrate value", body: "Talk about outcomes: trust, complete requests, time saved, nothing to manage. Never promise figures." },
          { key: "objections", title: "Handle objections", body: "An objection is a question in disguise. Ask what’s behind it before answering." },
          { key: "offer", title: "Send the offer", body: "Send your sales page for their sector: it explains everything and the price comes from Studio ATS." },
          { key: "follow_up", title: "Follow up", body: "No reply after a few days? One short, useful follow-up — then respect their answer." },
          { key: "close", title: "Close", body: "Agree on a clear next step: a call, a request on the page, or the purchase online." },
        ],
      },
    },
    {
      title: "Vendre Studio ATS — la méthode",
      summary: "Les 10 étapes d’une vente Studio ATS, pour toute cible. Ouvrez une cible pour y injecter ses problèmes et son angle.",
      tags: ["méthode", "découverte", "closing"],
      body: {
        intro: "Vendez le résultat, pas la technologie. Votre rôle : comprendre leur situation, montrer ce qu’ils perdent aujourd’hui, et envoyer la bonne page.",
        steps: [
          { key: "understand", title: "Les comprendre", body: "Avant de contacter, regardez comment ils se présentent en ligne et comment un nouveau client peut les joindre.", bullets: ["Regardez leur site, leurs réseaux et leurs avis", "Notez une chose précise que vous appréciez dans leur travail"] },
          { key: "opening", title: "Ouverture", body: "Commencez par eux, pas par Studio ATS. Une remarque sincère, une question.", bullets: ["« J’ai découvert votre travail sur … »", "« Petite question : comment vos nouveaux clients vous trouvent-ils ? »"] },
          { key: "discovery", title: "Découverte", body: "Questionnez, puis écoutez. Laissez-les décrire comment arrivent les demandes et ce qui se passe ensuite.", bullets: ["Comment les nouveaux clients vous contactent-ils ?", "Quelle information manque souvent ?", "Que se passe-t-il quand vous ne pouvez pas répondre tout de suite ?"] },
          { key: "pain", title: "Identifier le problème", body: "Nommez le problème avec leurs mots. N’inventez pas un problème qu’ils n’ont pas." },
          { key: "present", title: "Présenter Studio ATS", body: "Reliez Studio ATS au problème qu’ils viennent de décrire — une phrase, pas une liste de fonctionnalités.", bullets: ["« C’est exactement ce que Studio ATS prend en charge : … »"] },
          { key: "value", title: "Montrer la valeur", body: "Parlez résultats : confiance, demandes complètes, temps gagné, rien à gérer. Ne promettez jamais de chiffres." },
          { key: "objections", title: "Traiter les objections", body: "Une objection est une question déguisée. Demandez ce qu’il y a derrière avant de répondre." },
          { key: "offer", title: "Envoyer l’offre", body: "Envoyez votre page commerciale pour leur secteur : elle explique tout et le prix vient de Studio ATS." },
          { key: "follow_up", title: "Relancer", body: "Pas de réponse après quelques jours ? Une relance courte et utile — puis respectez leur réponse." },
          { key: "close", title: "Conclure", body: "Convenez d’une prochaine étape claire : un appel, une demande sur la page, ou l’achat en ligne." },
        ],
      },
    }),
  ...both("playbook", "artisans", { targetKey: "artisans", sort: 11 },
    {
      title: "Sell Studio ATS to an artisan",
      summary: "Phone-first, short, concrete. Artisans are busy: respect their time.",
      tags: ["artisan", "phone", "word of mouth", "social media"],
      body: {
        intro: "Artisans buy from people who understand their job. Talk about their clients and their time — never about “websites”.",
        steps: [
          { key: "understand", title: "Understand them", body: "They are on site most of the day, get work through word of mouth, and answer calls between two jobs. Their reputation is their main asset.", bullets: ["Look them up as a client would: what do you find?", "Note their trade, area and the type of jobs they show"] },
          { key: "opening", title: "Opening", body: "Call early morning or end of day. Be brief and specific.", bullets: ["“I looked you up as a client would — can I share what I noticed? It takes 2 minutes.”"] },
          { key: "discovery", title: "Discovery", body: "Three questions are enough.", bullets: ["How do most of your new clients find you?", "What happens when someone who doesn’t know you looks you up?", "How many calls do you miss while you’re on a job?"] },
          { key: "pain", title: "Identify the pain", body: "Usually: word of mouth has limits, the business looks less professional online than in reality, requests get lost." },
          { key: "present", title: "Present Studio ATS", body: "“Studio ATS gives your business a professional presence that works while you’re on site: people see your work and send complete requests — job, place, timing.”" },
          { key: "value", title: "Demonstrate value", body: "Trust from people who don’t know you yet. Requests you can answer in one go. Nothing to manage yourself." },
          { key: "objections", title: "Handle objections", body: "Expect: “I already have social media”, “my clients come by word of mouth”, “I don’t have time”." },
          { key: "offer", title: "Send the offer", body: "Send your artisan sales page by SMS or WhatsApp right after the call, while the conversation is fresh." },
          { key: "follow_up", title: "Follow up", body: "Two to three days later, one short message: “Did you have time to look? Any question I can answer?”" },
          { key: "close", title: "Close", body: "Propose the next step: a request on the page, a call with the Studio ATS team, or the purchase online when available." },
        ],
      },
    },
    {
      title: "Vendre Studio ATS à un artisan",
      summary: "Téléphone d’abord, court, concret. Les artisans sont occupés : respectez leur temps.",
      tags: ["artisan", "téléphone", "bouche-à-oreille", "réseaux sociaux"],
      body: {
        intro: "Les artisans achètent à ceux qui comprennent leur métier. Parlez de leurs clients et de leur temps — jamais de « site internet ».",
        steps: [
          { key: "understand", title: "Les comprendre", body: "Ils sont sur les chantiers la plupart de la journée, travaillent par bouche-à-oreille et répondent entre deux interventions. Leur réputation est leur principal atout.", bullets: ["Cherchez-les comme le ferait un client : que trouvez-vous ?", "Notez leur métier, leur zone et les travaux qu’ils montrent"] },
          { key: "opening", title: "Ouverture", body: "Appelez tôt le matin ou en fin de journée. Soyez bref et précis.", bullets: ["« Je vous ai cherché comme le ferait un client — je peux vous dire ce que j’ai remarqué ? Ça prend 2 minutes. »"] },
          { key: "discovery", title: "Découverte", body: "Trois questions suffisent.", bullets: ["Comment la plupart de vos nouveaux clients vous trouvent-ils ?", "Que se passe-t-il quand quelqu’un qui ne vous connaît pas vous cherche ?", "Combien d’appels manquez-vous pendant un chantier ?"] },
          { key: "pain", title: "Identifier le problème", body: "En général : le bouche-à-oreille a ses limites, l’entreprise paraît moins professionnelle en ligne qu’en vrai, des demandes se perdent." },
          { key: "present", title: "Présenter Studio ATS", body: "« Studio ATS donne à votre entreprise une présence professionnelle qui travaille pendant vos chantiers : on voit vos réalisations et on vous envoie des demandes complètes — travaux, lieu, délai. »" },
          { key: "value", title: "Montrer la valeur", body: "La confiance de ceux qui ne vous connaissent pas encore. Des demandes auxquelles on répond en une fois. Rien à gérer soi-même." },
          { key: "objections", title: "Traiter les objections", body: "Attendez-vous à : « j’ai déjà les réseaux sociaux », « mes clients viennent par le bouche-à-oreille », « je n’ai pas le temps »." },
          { key: "offer", title: "Envoyer l’offre", body: "Envoyez votre page artisans par SMS ou WhatsApp juste après l’appel, tant que l’échange est frais." },
          { key: "follow_up", title: "Relancer", body: "Deux à trois jours plus tard, un message court : « Vous avez eu le temps de regarder ? Une question ? »" },
          { key: "close", title: "Conclure", body: "Proposez la prochaine étape : une demande sur la page, un appel avec l’équipe Studio ATS, ou l’achat en ligne quand il est disponible." },
        ],
      },
    }),
];

// =============================================================== call scripts
const scripts = [
  ...both("call_script", "discovery-call", { channel: "phone", sort: 20 },
    {
      title: "Discovery call (any target)",
      summary: "5 minutes to understand, qualify and agree on a next step.",
      tags: ["phone", "discovery", "call"],
      body: {
        intro: "Tick each step as you go. Talk less than them.",
        steps: [
          { type: "opening", text: "Hello {{firstName}}, it’s {{advisorName}}. I’m calling about how new clients reach {{company}} — do you have 2 minutes?" },
          { type: "question", text: "How do most of your new clients find you today?" },
          { type: "listen", text: "Word of mouth only? Social media? Requests by phone during work?", hint: "Write down their exact words." },
          { type: "question", text: "What happens when someone who doesn’t know you looks you up online?" },
          { type: "problem", text: "They find little, or requests arrive scattered and incomplete." },
          { type: "response", text: "That’s what Studio ATS handles: a professional presence that inspires trust and collects complete requests — built and maintained for you." },
          { type: "objection", text: "“I already have social media.”" },
          { type: "answer", text: "Social media shows your work. Studio ATS turns the interest into a complete request. Where do people send you a request today?" },
          { type: "cta", text: "Can I send you the page for your sector? It explains everything, including the price, in 3 minutes." },
        ],
      },
    },
    {
      title: "Appel découverte (toute cible)",
      summary: "5 minutes pour comprendre, qualifier et convenir d’une prochaine étape.",
      tags: ["téléphone", "découverte", "appel"],
      body: {
        intro: "Cochez chaque étape au fil de l’appel. Parlez moins qu’eux.",
        steps: [
          { type: "opening", text: "Bonjour {{firstName}}, c’est {{advisorName}}. Je vous appelle au sujet de la façon dont les nouveaux clients contactent {{company}} — vous avez 2 minutes ?" },
          { type: "question", text: "Comment la plupart de vos nouveaux clients vous trouvent-ils aujourd’hui ?" },
          { type: "listen", text: "Uniquement le bouche-à-oreille ? Les réseaux ? Des appels pendant le travail ?", hint: "Notez leurs mots exacts." },
          { type: "question", text: "Que se passe-t-il quand quelqu’un qui ne vous connaît pas vous cherche en ligne ?" },
          { type: "problem", text: "Il trouve peu de choses, ou les demandes arrivent éparpillées et incomplètes." },
          { type: "response", text: "C’est ce que Studio ATS prend en charge : une présence professionnelle qui inspire confiance et recueille des demandes complètes — conçue et maintenue pour vous." },
          { type: "objection", text: "« J’ai déjà les réseaux sociaux. »" },
          { type: "answer", text: "Les réseaux montrent votre travail. Studio ATS transforme l’intérêt en demande complète. Aujourd’hui, où les gens vous envoient-ils une demande ?" },
          { type: "cta", text: "Je peux vous envoyer la page de votre secteur ? Elle explique tout, prix compris, en 3 minutes." },
        ],
      },
    }),
  ...both("call_script", "artisans-phone", { targetKey: "artisans", channel: "phone", sort: 21 },
    {
      title: "Artisan — first call",
      summary: "Short call between two jobs.",
      tags: ["artisan", "phone", "word of mouth"],
      body: {
        steps: [
          { type: "opening", text: "Hello {{firstName}}, {{advisorName}} here. I looked up {{company}} as a client would — can I tell you what I noticed? Two minutes." },
          { type: "question", text: "Most of your work comes through word of mouth, right?" },
          { type: "listen", text: "Pride in their reputation; maybe quieter periods; missed calls on site." },
          { type: "question", text: "And when a friend recommends you, what does that person find when they look you up?" },
          { type: "problem", text: "Little or nothing that reflects the quality of the work — some people call someone else." },
          { type: "response", text: "Studio ATS gives you a professional presence that works while you’re on site: people see your work and send you complete requests." },
          { type: "objection", text: "“I don’t have time for that.”" },
          { type: "answer", text: "That’s the point: the Studio ATS team builds and maintains it. You just receive the requests." },
          { type: "cta", text: "I’ll text you the page for artisans — have a look tonight, and I’ll call you back Thursday?" },
        ],
      },
    },
    {
      title: "Artisan — premier appel",
      summary: "Appel court entre deux chantiers.",
      tags: ["artisan", "téléphone", "bouche-à-oreille"],
      body: {
        steps: [
          { type: "opening", text: "Bonjour {{firstName}}, {{advisorName}} à l’appareil. J’ai cherché {{company}} comme le ferait un client — je peux vous dire ce que j’ai remarqué ? Deux minutes." },
          { type: "question", text: "L’essentiel de votre travail vient du bouche-à-oreille, c’est bien ça ?" },
          { type: "listen", text: "Fierté de leur réputation ; périodes plus calmes ; appels manqués sur les chantiers." },
          { type: "question", text: "Et quand un ami vous recommande, que trouve cette personne quand elle vous cherche ?" },
          { type: "problem", text: "Peu ou rien qui reflète la qualité du travail — certains appellent quelqu’un d’autre." },
          { type: "response", text: "Studio ATS vous donne une présence professionnelle qui travaille pendant vos chantiers : on voit vos réalisations et on vous envoie des demandes complètes." },
          { type: "objection", text: "« Je n’ai pas le temps pour ça. »" },
          { type: "answer", text: "Justement : l’équipe Studio ATS le conçoit et le maintient. Vous recevez simplement les demandes." },
          { type: "cta", text: "Je vous envoie par SMS la page pour les artisans — regardez ce soir, et je vous rappelle jeudi ?" },
        ],
      },
    }),
];

// =============================================================== messages
type Msg = [key: string, stage: FunnelStage, channel: Channel, target: string | undefined, enTitle: string, en: string, frTitle: string, fr: string, tags?: string[]];
const MESSAGES: Msg[] = [
  ["first-contact-whatsapp", "first_contact", "whatsapp", undefined,
    "First contact — short message",
    "Hello {{firstName}}, I came across {{company}} and liked your work. Quick question: how do most new clients reach you today? I work with Studio ATS, which helps professionals turn online interest into complete requests. Here’s a 3-minute overview for your sector: {{affiliateUrl}}",
    "Premier contact — message court",
    "Bonjour {{firstName}}, j’ai découvert {{company}} et j’ai aimé votre travail. Petite question : comment vos nouveaux clients vous contactent-ils aujourd’hui ? Je travaille avec Studio ATS, qui aide les professionnels à transformer l’intérêt en ligne en demandes complètes. Voici un aperçu de 3 minutes pour votre secteur : {{affiliateUrl}}"],
  ["first-contact-linkedin", "first_contact", "linkedin", undefined,
    "First contact — LinkedIn",
    "Hi {{firstName}}, I enjoy what you share about {{sector}}. When someone is interested in working with {{company}}, where do you send them? I help professionals set up Studio ATS, a space that presents their work and qualifies each request. Open to a quick look?",
    "Premier contact — LinkedIn",
    "Bonjour {{firstName}}, j’apprécie ce que vous partagez sur {{sector}}. Quand quelqu’un souhaite travailler avec {{company}}, où l’envoyez-vous ? J’accompagne des professionnels sur Studio ATS, un espace qui présente leur travail et qualifie chaque demande. Partant pour un rapide coup d’œil ?"],
  ["first-contact-sms-artisan", "first_contact", "sms", "artisans",
    "Artisan — first SMS after a call",
    "Hello {{firstName}}, thanks for the call. As promised, the page for artisans (3 min): {{affiliateUrl}} — {{advisorName}}",
    "Artisan — premier SMS après un appel",
    "Bonjour {{firstName}}, merci pour l’échange. Comme promis, la page pour les artisans (3 min) : {{affiliateUrl}} — {{advisorName}}"],
  ["follow-up-short", "follow_up", "whatsapp", undefined,
    "Follow-up — 3 days later",
    "Hello {{firstName}}, did you have a chance to look at the page I sent? Happy to answer any question in 5 minutes. {{affiliateUrl}}",
    "Relance — 3 jours après",
    "Bonjour {{firstName}}, avez-vous eu le temps de regarder la page que je vous ai envoyée ? Je réponds volontiers à vos questions en 5 minutes. {{affiliateUrl}}"],
  ["follow-up-in-person", "follow_up", "in_person", undefined,
    "After meeting in person",
    "Hello {{firstName}}, great to meet you today. As discussed, here is the Studio ATS page for your business: {{affiliateUrl}}. Tell me when suits you for a short call. {{advisorName}}",
    "Après une rencontre en personne",
    "Bonjour {{firstName}}, ravi de vous avoir rencontré aujourd’hui. Comme convenu, voici la page Studio ATS pour votre activité : {{affiliateUrl}}. Dites-moi quand vous arrange pour un court appel. {{advisorName}}"],
  ["no-response-last", "no_response", "other", undefined,
    "No response — last message",
    "Hello {{firstName}}, I don’t want to bother you: I’ll stop following up. If improving how new clients reach {{company}} becomes a priority, the page stays available: {{affiliateUrl}}. Have a great week.",
    "Pas de réponse — dernier message",
    "Bonjour {{firstName}}, je ne veux pas vous déranger : je ne vous relancerai plus. Si améliorer la façon dont les nouveaux clients contactent {{company}} devient une priorité, la page reste disponible : {{affiliateUrl}}. Belle semaine."],
  ["after-call-recap", "after_call", "whatsapp", undefined,
    "After the call — recap",
    "Thanks {{firstName}} for your time. To sum up: you’d like requests that arrive complete and a presence that reflects {{company}}. Everything is explained here, price included: {{affiliateUrl}}. Next step as agreed: {{campaign}}.",
    "Après l’appel — récapitulatif",
    "Merci {{firstName}} pour votre temps. En résumé : vous souhaitez des demandes qui arrivent complètes et une présence à l’image de {{company}}. Tout est expliqué ici, prix compris : {{affiliateUrl}}. Prochaine étape comme convenu : {{campaign}}."],
  ["interested-book", "interested", "other", undefined,
    "Interested — book the next step",
    "Great, {{firstName}}! The simplest next step: leave your request on this page so the Studio ATS team can prepare the call: {{affiliateUrl}}. Which day suits you?",
    "Intéressé — caler la suite",
    "Parfait, {{firstName}} ! Le plus simple : déposez votre demande sur cette page pour que l’équipe Studio ATS prépare l’appel : {{affiliateUrl}}. Quel jour vous arrange ?"],
  ["proposal-send-page", "proposal", "other", undefined,
    "Proposal — send the offer",
    "Hello {{firstName}}, as promised, here is the full Studio ATS offer for {{company}}: what’s included, how it works and the official price. {{affiliateUrl}}",
    "Proposition — envoyer l’offre",
    "Bonjour {{firstName}}, comme promis, voici l’offre Studio ATS complète pour {{company}} : ce qui est inclus, le fonctionnement et le prix officiel. {{affiliateUrl}}"],
  ["objection-social", "objection", "other", undefined,
    "Objection — “I already have social media”",
    "I understand, {{firstName}} — your social media shows your work well. Studio ATS doesn’t replace it: it turns that interest into complete requests, in one place you control. Where do people send you a request today?",
    "Objection — « J’ai déjà les réseaux sociaux »",
    "Je comprends, {{firstName}} — vos réseaux montrent bien votre travail. Studio ATS ne les remplace pas : il transforme cet intérêt en demandes complètes, dans un espace que vous maîtrisez. Aujourd’hui, où vous envoie-t-on une demande ?",
    ["instagram", "facebook", "réseaux sociaux", "social media"]],
  ["closing-checkout", "closing", "other", undefined,
    "Closing — check-in after a started purchase",
    "Hello {{firstName}}, I saw you were looking at Studio ATS. Any question before you decide? I’m available if you want to talk it through.",
    "Conclusion — après un achat commencé",
    "Bonjour {{firstName}}, j’ai vu que vous regardiez Studio ATS. Une question avant de vous décider ? Je suis disponible si vous voulez en parler."],
  ["renewal-check-in", "renewal", "email", undefined,
    "Client — friendly check-in",
    "Hello {{firstName}}, how is Studio ATS working for {{company}} so far? If anything can be improved, tell me and I’ll pass it on to the Studio ATS team.",
    "Client — prise de nouvelles",
    "Bonjour {{firstName}}, comment se passe Studio ATS pour {{company}} ? Si quelque chose peut être amélioré, dites-le-moi et je transmets à l’équipe Studio ATS."],
];
const messages = MESSAGES.flatMap(([key, stage, channel, targetKey, enTitle, en, frTitle, fr, tags], i) =>
  both("message", key, { stage, channel, targetKey, sort: 30 + i }, { title: enTitle, tags, body: { text: en } }, { title: frTitle, tags, body: { text: fr } }));

// =============================================================== emails
type Mail = [key: string, stage: FunnelStage, en: [string, string, string, string, string], fr: [string, string, string, string, string], tags?: string[]];
const MAILS: Mail[] = [
  ["email-first-contact", "first_contact",
    ["First contact", "{{company}} — turning online interest into requests", "A quick question about how new clients reach you.",
      "Hello {{firstName}},\n\nI came across {{company}} and genuinely liked your work.\n\nQuick question: when someone discovers you online, what happens next? Many professionals receive requests through a mix of forms, social media and messages — without the details they need.\n\nStudio ATS handles that: a professional space that presents your work, qualifies each request and helps book the appointment. It is built and maintained for you.\n\nHere is a 3-minute overview for your sector:",
      "See the overview"],
    ["Premier contact", "{{company}} — transformer l’intérêt en ligne en demandes", "Une question rapide sur la façon dont vos nouveaux clients vous contactent.",
      "Bonjour {{firstName}},\n\nJ’ai découvert {{company}} et j’ai sincèrement apprécié votre travail.\n\nPetite question : quand quelqu’un vous découvre en ligne, que se passe-t-il ensuite ? Beaucoup de professionnels reçoivent des demandes par formulaire, réseaux et messages — sans les informations dont ils ont besoin.\n\nStudio ATS s’en charge : un espace professionnel qui présente votre travail, qualifie chaque demande et facilite la prise de rendez-vous. Il est conçu et maintenu pour vous.\n\nVoici un aperçu de 3 minutes pour votre secteur :",
      "Voir l’aperçu"]],
  ["email-follow-up", "follow_up",
    ["Follow-up after 3 days", "Re: {{company}} — turning online interest into requests", "Bringing this back to the top of your inbox.",
      "Hello {{firstName}},\n\nJust bringing this back to the top of your inbox. If requests arriving without the right details sound familiar, Studio ATS is worth 3 minutes.\n\nIf it’s not a priority right now, no problem at all — tell me and I won’t follow up again.",
      "See the page"],
    ["Relance après 3 jours", "Re : {{company}} — transformer l’intérêt en ligne en demandes", "Je remonte mon message en haut de votre boîte.",
      "Bonjour {{firstName}},\n\nJe remonte simplement mon message. Si des demandes sans les bonnes informations vous parlent, Studio ATS vaut 3 minutes.\n\nSi ce n’est pas une priorité en ce moment, aucun problème — dites-le-moi et je ne vous relancerai plus.",
      "Voir la page"]],
  ["email-after-call", "after_call",
    ["After the call — recap", "Our call — next steps for {{company}}", "What we discussed and the next step.",
      "Hello {{firstName}},\n\nThank you for your time today. What I understood:\n• how new clients reach you today\n• what you’d like to improve\n\nEverything about Studio ATS — what’s included, how it works and the official price — is on this page:",
      "Open my Studio ATS page"],
    ["Après l’appel — récapitulatif", "Notre échange — prochaines étapes pour {{company}}", "Ce que nous avons évoqué et la suite.",
      "Bonjour {{firstName}},\n\nMerci pour votre temps aujourd’hui. Ce que j’ai compris :\n• comment les nouveaux clients vous contactent aujourd’hui\n• ce que vous aimeriez améliorer\n\nTout sur Studio ATS — ce qui est inclus, le fonctionnement et le prix officiel — est sur cette page :",
      "Ouvrir ma page Studio ATS"]],
  ["email-proposal", "proposal",
    ["Proposal", "The Studio ATS offer for {{company}}", "Everything in one page, price included.",
      "Hello {{firstName}},\n\nAs promised, here is the full Studio ATS offer for {{company}}. You’ll find what’s included, how the set-up works, and the official price and terms.\n\nI’m available for any question.",
      "See the offer"],
    ["Proposition", "L’offre Studio ATS pour {{company}}", "Tout sur une page, prix compris.",
      "Bonjour {{firstName}},\n\nComme promis, voici l’offre Studio ATS complète pour {{company}}. Vous y trouverez ce qui est inclus, le déroulement de la mise en place, ainsi que le prix et les conditions officiels.\n\nJe reste disponible pour toute question.",
      "Voir l’offre"]],
  ["email-social-not-enough", "objection",
    ["Social presence isn’t enough", "Social media shows your work. Does it bring you requests?", "Why social media and Studio ATS are complementary.",
      "Hello {{firstName}},\n\nYour social media shows your work well — keep it. The question is what happens after someone is interested: a message lost among others, a request without details, a call you can’t take.\n\nStudio ATS is the place where that interest becomes a complete request, in a space you control. It complements your social profiles; it doesn’t replace them.",
      "See how it works"],
    ["Les réseaux sociaux ne suffisent pas", "Vos réseaux montrent votre travail. Vous apportent-ils des demandes ?", "Pourquoi réseaux sociaux et Studio ATS sont complémentaires.",
      "Bonjour {{firstName}},\n\nVos réseaux montrent bien votre travail — gardez-les. La question est ce qui se passe après l’intérêt : un message perdu parmi d’autres, une demande sans détails, un appel que vous ne pouvez pas prendre.\n\nStudio ATS est l’endroit où cet intérêt devient une demande complète, dans un espace que vous maîtrisez. Il complète vos réseaux ; il ne les remplace pas.",
      "Voir comment ça marche"], ["instagram", "facebook", "réseaux sociaux", "social media"]],
  ["email-last-follow-up", "no_response",
    ["Last follow-up", "Should I close your file?", "One last message — then I stop.",
      "Hello {{firstName}},\n\nI haven’t heard back, so I’ll assume it isn’t the right time — I won’t follow up again.\n\nIf things change, the page stays available.",
      "Keep the page"],
    ["Dernière relance", "Je clos votre dossier ?", "Un dernier message — ensuite j’arrête.",
      "Bonjour {{firstName}},\n\nSans nouvelles de votre part, je suppose que ce n’est pas le bon moment — je ne vous relancerai plus.\n\nSi les choses changent, la page reste disponible.",
      "Garder la page"]],
];
const emails = MAILS.flatMap(([key, stage, en, fr, tags], i) =>
  both("email_template", key, { stage, channel: "email", sort: 50 + i },
    { title: en[0], tags, body: { subject: en[1], preview: en[2], body: en[3], cta: en[4] } },
    { title: fr[0], tags, body: { subject: fr[1], preview: fr[2], body: fr[3], cta: fr[4] } }));

// =============================================================== objections
type Obj = [key: string, tags: string[], en: [string, string, string[], string, string, string], fr: [string, string, string[], string, string, string]];
const OBJECTIONS: Obj[] = [
  ["already-social-media", ["instagram", "facebook", "social media", "réseaux sociaux", "tiktok"],
    ["“I already have social media.”", "Social media feels like enough visibility — or they don’t see what’s missing.",
      ["Where do people send you a request today?", "What happens to a request that arrives on a Saturday night?"],
      "Social media shows your work. Studio ATS turns that interest into complete requests, in a place you control.",
      "Keep your social media: it’s great for showing your work. But a DM is not a request — no budget, no timing, lost among other messages, and the platform decides who sees you. Studio ATS is the professional place where interest becomes a complete request you can answer in one go.",
      "Send the sales page and ask them to compare it with their profile."],
    ["« J’ai déjà les réseaux sociaux. »", "Les réseaux semblent suffire pour la visibilité — ou ils ne voient pas ce qui manque.",
      ["Aujourd’hui, où vous envoie-t-on une demande ?", "Que devient une demande qui arrive un samedi soir ?"],
      "Les réseaux montrent votre travail. Studio ATS transforme cet intérêt en demandes complètes, dans un espace que vous maîtrisez.",
      "Gardez vos réseaux : ils sont parfaits pour montrer votre travail. Mais un message privé n’est pas une demande — ni budget, ni délai, perdu parmi d’autres, et c’est la plateforme qui décide qui vous voit. Studio ATS est l’espace professionnel où l’intérêt devient une demande complète, à laquelle on répond en une fois.",
      "Envoyez la page commerciale et proposez-leur de la comparer à leur profil."]],
  ["word-of-mouth", ["bouche-à-oreille", "word of mouth", "referrals", "recommandation"],
    ["“My clients come through word of mouth.”", "They are proud of their reputation — and don’t see the link with being online.",
      ["When a friend recommends you, what does that person do before calling?", "Are there quieter periods in the year?"],
      "Word of mouth brings people to you. Studio ATS makes sure they call you once they’ve looked you up.",
      "That’s a sign of great work. But today, even a recommended client checks online before calling. If they find little, some hesitate or call someone else. Studio ATS doesn’t replace word of mouth: it confirms it.",
      "Suggest they look themselves up as a client would."],
    ["« Mes clients viennent par le bouche-à-oreille. »", "Ils sont fiers de leur réputation — et ne voient pas le lien avec le fait d’être en ligne.",
      ["Quand un ami vous recommande, que fait cette personne avant d’appeler ?", "Y a-t-il des périodes plus calmes dans l’année ?"],
      "Le bouche-à-oreille vous amène des gens. Studio ATS fait en sorte qu’ils vous appellent après vous avoir cherché.",
      "C’est le signe d’un excellent travail. Mais aujourd’hui, même un client recommandé vérifie en ligne avant d’appeler. S’il trouve peu de choses, il hésite ou appelle quelqu’un d’autre. Studio ATS ne remplace pas le bouche-à-oreille : il le confirme.",
      "Proposez-leur de se chercher eux-mêmes comme le ferait un client."]],
  ["no-online-selling", ["e-commerce", "vendre en ligne", "sell online", "boutique"],
    ["“I don’t need to sell online.”", "They think Studio ATS is an online shop.",
      ["How does a new client contact you today?", "What do you need to know before giving a quote?"],
      "Studio ATS is not an online shop: it helps people who don’t know you yet to trust you and send you a proper request.",
      "You don’t sell online — you sell through conversations and quotes. Studio ATS prepares those conversations: people see your work, understand what you do and send a request with the right details. The sale still happens with you.",
      "Show the “How it works” section of the sales page."],
    ["« Je n’ai pas besoin de vendre en ligne. »", "Ils pensent que Studio ATS est une boutique en ligne.",
      ["Comment un nouveau client vous contacte-t-il aujourd’hui ?", "Que devez-vous savoir avant de faire un devis ?"],
      "Studio ATS n’est pas une boutique en ligne : il aide ceux qui ne vous connaissent pas encore à vous faire confiance et à vous envoyer une vraie demande.",
      "Vous ne vendez pas en ligne — vous vendez par la discussion et le devis. Studio ATS prépare ces discussions : on voit votre travail, on comprend ce que vous faites, et on vous envoie une demande avec les bonnes informations. La vente se fait toujours avec vous.",
      "Montrez la section « Comment ça marche » de la page commerciale."]],
  ["no-time", ["temps", "time", "busy", "occupé"],
    ["“I won’t have time to answer.”", "They fear more work or more admin.",
      ["How much time do you spend today on calls that lead nowhere?", "What would help you answer faster?"],
      "Studio ATS is built to save time: requests arrive complete, so you answer once.",
      "It’s precisely for busy people. The Studio ATS team builds and maintains everything. Requests arrive with the details you need, in one place, so you don’t spend time chasing information or returning vague calls.",
      "Offer to send the page so they can look at it in the evening."],
    ["« Je n’aurai pas le temps de répondre. »", "Ils craignent plus de travail ou d’administratif.",
      ["Combien de temps passez-vous aujourd’hui sur des appels qui ne mènent à rien ?", "Qu’est-ce qui vous aiderait à répondre plus vite ?"],
      "Studio ATS est fait pour gagner du temps : les demandes arrivent complètes, vous répondez en une fois.",
      "C’est justement pour les gens occupés. L’équipe Studio ATS conçoit et maintient tout. Les demandes arrivent avec les informations nécessaires, au même endroit : vous ne perdez plus de temps à courir après des informations ou à rappeler des demandes floues.",
      "Proposez d’envoyer la page pour qu’ils la regardent le soir."]],
  ["too-expensive", ["prix", "price", "cher", "expensive", "budget"],
    ["“It’s too expensive.”", "They compare with a cheap website, or can’t see the value yet.",
      ["What is one new client worth to you?", "What are you comparing it with?"],
      "Compare it with the value of the clients it helps you win — not with the price of a basic website.",
      "Studio ATS is not a basic website: it’s the whole path from first visit to request, built and maintained for you. Many professionals look at it this way: what is a single new client worth? The price is official and identical for everyone — you won’t get a better one elsewhere by negotiating.",
      "Never discount or promise a result. Send the offer section of the page."],
    ["« C’est trop cher. »", "Ils comparent avec un site bon marché, ou ne voient pas encore la valeur.",
      ["Que vous rapporte un nouveau client ?", "Avec quoi comparez-vous ?"],
      "Comparez-le à la valeur des clients qu’il aide à obtenir — pas au prix d’un site basique.",
      "Studio ATS n’est pas un site basique : c’est tout le parcours de la visite à la demande, conçu et maintenu pour vous. Beaucoup de professionnels raisonnent ainsi : que vaut un seul nouveau client ? Le prix est officiel et identique pour tous — il ne se négocie pas.",
      "Ne faites jamais de remise ni de promesse de résultat. Envoyez la section offre de la page."]],
  ["already-website", ["site", "website", "déjà un site", "already"],
    ["“I already have a website.”", "They think it does the same job.",
      ["How many requests does it bring you each month?", "What happens after someone fills in your form?"],
      "Keep it if it works. Studio ATS is about what a site rarely does: qualify requests and help book appointments.",
      "A website presents; Studio ATS converts. The question is not whether you have a site, but whether it turns visitors into complete requests and appointments. If yours already does, great. If not, that’s exactly the part Studio ATS handles.",
      "Ask to look at their current request form together."],
    ["« J’ai déjà un site. »", "Ils pensent qu’il fait le même travail.",
      ["Combien de demandes vous apporte-t-il chaque mois ?", "Que se passe-t-il après qu’on remplit votre formulaire ?"],
      "Gardez-le s’il fonctionne. Studio ATS porte sur ce qu’un site fait rarement : qualifier les demandes et faciliter les rendez-vous.",
      "Un site présente ; Studio ATS convertit. La question n’est pas d’avoir un site, mais s’il transforme les visiteurs en demandes complètes et en rendez-vous. Si le vôtre le fait déjà, parfait. Sinon, c’est exactement la partie dont Studio ATS s’occupe.",
      "Proposez de regarder ensemble leur formulaire de contact actuel."]],
  ["think-about-it", ["réfléchir", "think", "plus tard", "later"],
    ["“I need to think about it.”", "Something is unclear, or it’s not the right moment.",
      ["What would you need to know to decide?", "Is it the timing, the budget or something else?"],
      "Of course. What’s the one thing you’d need clarified to decide?",
      "Taking time is normal. Usually one question remains — price, timing, or how it would work for them. Ask which one, answer it precisely, then agree on a date to talk again.",
      "Agree on a follow-up date and log it in your CRM."],
    ["« Je dois réfléchir. »", "Quelque chose n’est pas clair, ou ce n’est pas le bon moment.",
      ["Que vous faudrait-il savoir pour décider ?", "C’est le moment, le budget, ou autre chose ?"],
      "Bien sûr. Quelle est la chose qu’il faudrait clarifier pour décider ?",
      "Prendre le temps est normal. En général, une question reste en suspens — prix, calendrier, ou fonctionnement pour eux. Demandez laquelle, répondez précisément, puis convenez d’une date pour en reparler.",
      "Convenez d’une date de relance et notez-la dans votre CRM."]],
  ["not-now", ["pas maintenant", "not now", "timing", "saison"],
    ["“Not now.”", "Busy season, or other priorities.",
      ["When would be a better time?", "What’s your quieter period?"],
      "Understood — when would it make sense to talk again?",
      "Respect it and plan: the best moment to set up Studio ATS is often just before a busy period, so it works when requests come in. Ask when to come back and note it.",
      "Set a reminder in the CRM — never insist."],
    ["« Pas maintenant. »", "Période chargée, ou autres priorités.",
      ["Quel serait un meilleur moment ?", "Quelle est votre période plus calme ?"],
      "Entendu — quand serait-il pertinent d’en reparler ?",
      "Respectez-le et planifiez : le meilleur moment pour mettre en place Studio ATS est souvent juste avant une période chargée, pour qu’il fonctionne quand les demandes arrivent. Demandez quand revenir vers eux et notez-le.",
      "Programmez un rappel dans le CRM — sans jamais insister."]],
];
const objections = OBJECTIONS.flatMap(([key, tags, en, fr], i) =>
  both("objection", key, { stage: "objection", sort: 70 + i },
    { title: en[0], tags, body: { objection: en[0], meaning: en[1], questions: en[2], short: en[3], long: en[4], nextStep: en[5] } },
    { title: fr[0], tags, body: { objection: fr[0], meaning: fr[1], questions: fr[2], short: fr[3], long: fr[4], nextStep: fr[5] } }));

// =============================================================== product knowledge (Studio ATS)
type K = [section: BodyByKind["knowledge"]["section"], status: "active" | "draft", en: [string, [string, string][]], fr: [string, [string, string][]]];
const KNOWLEDGE: K[] = [
  ["what_it_is", "active",
    ["What it is", [["An online commercial studio", "Studio ATS is an online commercial studio for professionals whose every new client has real value: it presents their work, qualifies requests and helps book appointments — in one place."]]],
    ["Ce que c’est", [["Un studio commercial en ligne", "Studio ATS est un studio commercial en ligne pour les professionnels dont chaque nouveau client compte : il présente leur travail, qualifie les demandes et facilite la prise de rendez-vous — au même endroit."]]]],
  ["what_it_does", "active",
    ["What it does", [["From first visit to booked appointment", "The site is only one part. Studio ATS covers the whole path: showcase, request, qualification, appointment, follow-up."]]],
    ["Ce que ça fait", [["De la première visite au rendez-vous", "Le site n’est qu’une partie. Studio ATS couvre tout le parcours : vitrine, demande, qualification, rendez-vous, relance."]]]],
  ["customer_gets", "active",
    ["What the customer gets", [["Done for them", "The Studio ATS team designs, sets up, hosts and maintains it. The customer receives structured requests."], ["One place", "Every contact and request in one place, with history."]]],
    ["Ce que le client obtient", [["Clé en main", "L’équipe Studio ATS conçoit, met en place, héberge et maintient. Le client reçoit des demandes structurées."], ["Un seul endroit", "Tous les contacts et demandes au même endroit, avec l’historique."]]]],
  ["benefits", "active",
    ["Business benefits", [["Trust", "A premium presence that matches the quality of the work."], ["Qualified requests", "Budget, timing and project type known before the first call."], ["Time", "Fewer vague calls and forgotten follow-ups."]]],
    ["Bénéfices métier", [["Confiance", "Une présence premium à la hauteur du travail."], ["Demandes qualifiées", "Budget, délai et type de projet connus avant le premier appel."], ["Temps", "Moins d’appels flous et de relances oubliées."]]]],
  ["features", "active",
    ["Features", [["Showcase", "Present the activity and best work with a premium, fast site."], ["Convert", "Guided request forms turn visitors into structured enquiries."], ["Qualify", "Know budget, timing and project type before the call."], ["Centralise", "Every contact and request in one place, with full history."], ["Book", "Qualified prospects request an appointment in a few clicks."], ["Automate", "Transactional emails and follow-ups go out on time."], ["Track", "Follow each request from first visit to signed client."], ["Measure", "See which pages, sources and campaigns bring real opportunities."]]],
    ["Fonctionnalités", [["Vitrine", "Présenter l’activité et les plus beaux travaux avec un site premium et rapide."], ["Conversion", "Des formulaires guidés transforment les visiteurs en demandes structurées."], ["Qualification", "Connaître budget, délai et type de projet avant l’appel."], ["Centralisation", "Tous les contacts et demandes au même endroit, avec l’historique."], ["Rendez-vous", "Les prospects qualifiés demandent un rendez-vous en quelques clics."], ["Automatisation", "Emails transactionnels et relances envoyés au bon moment."], ["Suivi", "Suivre chaque demande de la première visite au client signé."], ["Mesure", "Voir quelles pages, sources et campagnes apportent de vraies opportunités."]]]],
  ["technical", "active",
    ["Technical information", [["Hosting & maintenance", "Included and handled by the Studio ATS team."], ["Integrations", "Calendar, email and analytics integrations. The exact list is confirmed during onboarding — don’t promise a specific tool."]]],
    ["Informations techniques", [["Hébergement & maintenance", "Inclus et gérés par l’équipe Studio ATS."], ["Intégrations", "Intégrations agenda, email et statistiques. La liste exacte est confirmée à l’onboarding — ne promettez pas un outil précis."]]]],
  ["included", "active",
    ["What’s included", [["Design and set-up", "Design and set-up of the customer’s Studio ATS."], ["Portfolio and commercial pages", "Pages that present the work and the offer."], ["Lead capture and qualification", "Guided forms and qualification."], ["Contacts and appointment requests", "Centralised with history."], ["Automated emails and follow-ups", "Sent on time."], ["Analytics", "What brings real opportunities."], ["Hosting and maintenance", "Handled by Studio ATS."]]],
    ["Ce qui est inclus", [["Conception et mise en place", "Conception et mise en place du Studio ATS du client."], ["Portfolio et pages commerciales", "Des pages qui présentent le travail et l’offre."], ["Captation et qualification des demandes", "Formulaires guidés et qualification."], ["Contacts et demandes de rendez-vous", "Centralisés avec l’historique."], ["Emails et relances automatiques", "Envoyés au bon moment."], ["Statistiques", "Ce qui apporte de vraies opportunités."], ["Hébergement et maintenance", "Gérés par Studio ATS."]]]],
  ["pricing", "active",
    ["Pricing", [["Official price", "The price shown here comes from Studio ATS’s official catalog. It is the same for everyone and affiliates never change or negotiate it."], ["Terms", "Final terms are in the customer contract."]]],
    ["Tarifs", [["Prix officiel", "Le prix affiché ici vient du catalogue officiel de Studio ATS. Il est identique pour tous et les affiliés ne le modifient ni ne le négocient jamais."], ["Conditions", "Les conditions définitives figurent au contrat client."]]]],
  ["faq", "active",
    ["FAQ", [["Is it just a website?", "No: the site is one part of a complete path from first visit to appointment."], ["Who builds it?", "The Studio ATS team designs, sets up and maintains it."], ["Can the customer keep their social media?", "Yes. Studio ATS complements social profiles."]]],
    ["FAQ", [["Est-ce juste un site ?", "Non : le site est une partie d’un parcours complet, de la visite au rendez-vous."], ["Qui le réalise ?", "L’équipe Studio ATS le conçoit, le met en place et le maintient."], ["Le client garde-t-il ses réseaux sociaux ?", "Oui. Studio ATS complète les profils sociaux."]]]],
  ["not_included", "draft",
    ["What’s not included", [["To be confirmed by Studio ATS", "List what is outside the offer before publishing this section."]]],
    ["Ce qui n’est pas inclus", [["À confirmer par Studio ATS", "Lister ce qui est hors offre avant de publier cette section."]]]],
  ["limitations", "draft",
    ["Limitations", [["To be confirmed by Studio ATS", "Document known limitations honestly before publishing this section."]]],
    ["Limites", [["À confirmer par Studio ATS", "Documenter honnêtement les limites connues avant de publier cette section."]]]],
];
const knowledge = KNOWLEDGE.flatMap(([section, status, en, fr], i) =>
  both("knowledge", `studio.${section}`, { sort: 100 + i, status },
    { title: en[0], body: { section, items: en[1].map(([title, body]) => ({ title, body })) } },
    { title: fr[0], body: { section, items: fr[1].map(([title, body]) => ({ title, body })) } }));

// =============================================================== assets
const assets = both("asset", "studio-public-page", { sort: 200 },
  { title: "Studio ATS public presentation", summary: "The official product page — share it or use it as a live demo.", body: { category: "demo", url: "/en/studio", description: "Always up to date: it is the live product page." } },
  { title: "Présentation publique Studio ATS", summary: "La page produit officielle — à partager ou à utiliser comme démo en direct.", body: { category: "demo", url: "/fr/studio", description: "Toujours à jour : c’est la page produit en ligne." } });

// =============================================================== first week
const journey = both("journey", "first-week", { sort: 0 },
  {
    title: "Your first week",
    summary: "A recommended action plan — not a promise of results.",
    body: {
      disclaimer: "A recommended plan to build a routine. Results depend on your work, your market and your prospects; nothing here is a promise of sales or income.",
      days: [
        { day: 1, title: "Understand Studio ATS", body: "Read Product knowledge and one playbook.", tasks: ["Read what Studio ATS is and what’s included", "Open the playbook for your target"] },
        { day: 2, title: "Choose 20 prospects", body: "Pick one target and list 20 real businesses near you.", tasks: ["Choose your target", "Add 20 prospects to your CRM"] },
        { day: 3, title: "Contact your first prospects", body: "Send your first personalised messages.", tasks: ["Send 5 first-contact messages", "Create your sales page for the target"] },
        { day: 4, title: "Follow up", body: "Follow up with those who haven’t answered — once, briefly.", tasks: ["Send follow-ups", "Move replies to “Replied”"] },
        { day: 5, title: "Run calls", body: "Use the call script with those who replied.", tasks: ["Run at least one discovery call", "Log the next step for each call"] },
        { day: 6, title: "Send relevant sales pages", body: "Send your page to qualified prospects.", tasks: ["Send your sales page after each call", "Check that the page looks right on mobile"] },
        { day: 7, title: "Review", body: "Look at what worked: which message, which target, which channel.", tasks: ["Review your page and link performance", "Plan next week"] },
      ],
    },
  },
  {
    title: "Votre première semaine",
    summary: "Un plan d’action recommandé — pas une promesse de résultats.",
    body: {
      disclaimer: "Un plan recommandé pour prendre un rythme. Les résultats dépendent de votre travail, de votre marché et de vos prospects ; rien ici n’est une promesse de ventes ou de revenus.",
      days: [
        { day: 1, title: "Comprendre Studio ATS", body: "Lisez la fiche produit et un playbook.", tasks: ["Lire ce qu’est Studio ATS et ce qui est inclus", "Ouvrir le playbook de votre cible"] },
        { day: 2, title: "Choisir 20 prospects", body: "Choisissez une cible et listez 20 vraies entreprises près de chez vous.", tasks: ["Choisir votre cible", "Ajouter 20 prospects au CRM"] },
        { day: 3, title: "Contacter vos premiers prospects", body: "Envoyez vos premiers messages personnalisés.", tasks: ["Envoyer 5 messages de premier contact", "Créer votre page commerciale pour la cible"] },
        { day: 4, title: "Relancer", body: "Relancez ceux qui n’ont pas répondu — une fois, brièvement.", tasks: ["Envoyer les relances", "Passer les réponses en « A répondu »"] },
        { day: 5, title: "Faire des appels", body: "Utilisez le script d’appel avec ceux qui ont répondu.", tasks: ["Mener au moins un appel découverte", "Noter la prochaine étape de chaque appel"] },
        { day: 6, title: "Envoyer les pages commerciales", body: "Envoyez votre page aux prospects qualifiés.", tasks: ["Envoyer votre page après chaque appel", "Vérifier l’affichage de la page sur mobile"] },
        { day: 7, title: "Faire le point", body: "Regardez ce qui a marché : quel message, quelle cible, quel canal.", tasks: ["Consulter les performances de votre page et de vos liens", "Planifier la semaine suivante"] },
      ],
    },
  });

export const defaultSalesContent: SeedContent[] = [
  ...template, ...variants, ...angles, ...playbooks, ...scripts, ...messages, ...emails, ...objections, ...knowledge, ...assets, ...journey,
];
