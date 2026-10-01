/**
 * Default market cards. In production these live in `public.markets`
 * (admin-managed, localised JSON); this file is the seed and the fallback.
 * Rule: no invented revenue / ROI figures.
 */
import type { Locale } from "@/i18n/config";
import { salesTargets } from "./sales-center/targets.ts";
import { marketTranslations } from "./i18n/markets.ts";

export interface MarketContent {
  name: string;
  who: string;
  why: string;
  problem: string;
  angle: string;
  message: string;
  searches: string[];
  /** V0.3 Sales Center (optional: older markets may not have them yet). */
  pains?: string[];
  needs?: string[];
  outcomes?: string[];
  discovery?: string[];
  /** What NOT to sell this target (e.g. "a small website"). */
  avoid?: string;
}

export interface Market {
  id: string;
  slug: string;
  icon: string;
  sort: number;
  /** 1–5: how well Studio ATS fits this target (admin-set). */
  relevance?: number;
  content: Partial<Record<Locale, MarketContent>> & { en: MarketContent };
}

const m = (slug: string, icon: string, sort: number, en: MarketContent, fr: MarketContent): Market => ({
  id: `mkt_${slug}`,
  slug,
  icon,
  sort,
  content: { en, fr },
});

const baseMarkets: Market[] = [
  m("photographers", "camera", 1,
    {
      name: "Photographers",
      who: "Wedding, portrait, corporate and architecture photographers with a premium offer.",
      why: "Their portfolio is their shop window — Studio ATS turns it into a booking engine.",
      problem: "Enquiries arrive through Instagram DMs and a basic form, without date, budget or project type.",
      angle: "Stop answering vague DMs — receive qualified requests with the date and budget already filled in.",
      message: "Hi [First name], I love your work on [project]. Quick question: how do most of your clients contact you today? I work with Studio ATS, which turns a photographer’s portfolio into a space that qualifies requests (date, budget, type of shoot) and books calls automatically. Open to a 10-minute look?",
      searches: ["wedding photographer [city]", "portrait photographer [city]", "#weddingphotographer [city]"],
    },
    {
      name: "Photographes",
      who: "Photographes de mariage, portrait, entreprise et architecture avec une offre premium.",
      why: "Leur portfolio est leur vitrine — Studio ATS en fait un outil de réservation.",
      problem: "Les demandes arrivent en DM Instagram et via un formulaire basique, sans date, budget ni type de projet.",
      angle: "Arrêtez de répondre à des DM vagues — recevez des demandes qualifiées avec date et budget.",
      message: "Bonjour [Prénom], j’adore votre travail sur [projet]. Petite question : comment la plupart de vos clients vous contactent-ils aujourd’hui ? Je travaille avec Studio ATS, qui transforme le portfolio d’un photographe en espace qui qualifie les demandes (date, budget, type de séance) et programme les appels automatiquement. Ouvert à un aperçu de 10 minutes ?",
      searches: ["photographe mariage [ville]", "photographe portrait [ville]", "#photographemariage [ville]"],
    }),
  m("wedding-planners", "rings", 2,
    {
      name: "Wedding planners",
      who: "Independent planners and agencies organising premium weddings.",
      why: "Each wedding is a high-value project; every missed request is a lost season slot.",
      problem: "Couples send the same questions again and again; qualification happens over long email threads.",
      angle: "Let couples present their project before the first call — you only talk to the right ones.",
      message: "Hello [First name], your [venue / style] weddings are beautiful. I’m reaching out because Studio ATS helps planners receive couples’ requests already qualified — date, guests, budget, style — and book the discovery call automatically. Would it be useful to see how it works?",
      searches: ["wedding planner [city]", "organisatrice mariage [city]", "destination wedding planner [region]"],
    },
    {
      name: "Wedding planners",
      who: "Wedding planners indépendants et agences organisant des mariages haut de gamme.",
      why: "Chaque mariage est un projet à forte valeur ; chaque demande perdue est une date perdue.",
      problem: "Les couples posent toujours les mêmes questions ; la qualification se fait par longs échanges d’emails.",
      angle: "Laissez les couples présenter leur projet avant le premier appel — vous ne parlez qu’aux bons.",
      message: "Bonjour [Prénom], vos mariages [lieu / style] sont superbes. Je vous contacte car Studio ATS aide les wedding planners à recevoir des demandes déjà qualifiées — date, invités, budget, style — et à programmer l’appel découverte automatiquement. Ça vous intéresserait de voir comment ça marche ?",
      searches: ["wedding planner [ville]", "organisatrice de mariage [ville]", "mariage clé en main [région]"],
    }),
  m("videographers", "video", 3,
    {
      name: "Videographers",
      who: "Wedding, corporate and brand-content videographers and small production studios.",
      why: "Video projects are expensive — prospects need to see work and understand the process before calling.",
      problem: "Showreels live on YouTube/Vimeo, requests come in without scope, quoting takes hours.",
      angle: "Your showreel + a guided brief = requests you can quote immediately.",
      message: "Hi [First name], great reel on [project]. When a brand contacts you, do you usually get a clear brief? Studio ATS turns your portfolio into a space where prospects describe format, deadline and budget before the call. Worth a quick look?",
      searches: ["videographer [city]", "video production company [city]", "wedding videographer [region]"],
    },
    {
      name: "Vidéastes",
      who: "Vidéastes mariage, corporate, contenu de marque et petits studios de production.",
      why: "Un projet vidéo coûte cher — le prospect doit voir le travail et comprendre le process avant d’appeler.",
      problem: "Les showreels sont sur YouTube/Vimeo, les demandes arrivent sans cadrage, chiffrer prend des heures.",
      angle: "Votre showreel + un brief guidé = des demandes chiffrables immédiatement.",
      message: "Bonjour [Prénom], super réalisation sur [projet]. Quand une marque vous contacte, avez-vous en général un brief clair ? Studio ATS transforme votre portfolio en espace où le prospect précise format, délai et budget avant l’appel. Ça vaut un coup d’œil ?",
      searches: ["vidéaste [ville]", "société de production vidéo [ville]", "vidéaste mariage [région]"],
    }),
  m("architects", "ruler", 4,
    {
      name: "Architects",
      who: "Architecture practices working with private clients and small businesses.",
      why: "Projects have long cycles and high value — first impressions and qualification matter.",
      problem: "Most requests are too early, too small or out of scope, and take time to filter.",
      angle: "Present your references like a monograph and filter projects by scope before the first meeting.",
      message: "Hello [First name], I came across your project [name]. Many practices tell me they spend time on requests that aren’t a fit. Studio ATS presents your references and qualifies each project (type, surface, budget, timing) before the first meeting. Open to a short demo?",
      searches: ["architect [city]", "architecte DPLG [city]", "residential architect [region]"],
    },
    {
      name: "Architectes",
      who: "Cabinets d’architecture travaillant avec des particuliers et des petites entreprises.",
      why: "Des cycles longs, une forte valeur — la première impression et la qualification comptent.",
      problem: "Beaucoup de demandes arrivent trop tôt, sont trop petites ou hors périmètre, et prennent du temps à trier.",
      angle: "Présentez vos références comme une monographie et filtrez les projets avant le premier rendez-vous.",
      message: "Bonjour [Prénom], j’ai découvert votre projet [nom]. Beaucoup de cabinets me disent passer du temps sur des demandes qui ne leur correspondent pas. Studio ATS présente vos références et qualifie chaque projet (type, surface, budget, délai) avant le premier rendez-vous. Partant pour une courte démo ?",
      searches: ["architecte [ville]", "architecte maison individuelle [ville]", "architecte rénovation [région]"],
    }),
  m("interior-designers", "sofa", 5,
    {
      name: "Interior designers",
      who: "Interior designers and decorators working on premium residential or hospitality projects.",
      why: "Their work is visual and their clients buy on trust and taste.",
      problem: "Beautiful Instagram, but no structured way to capture and qualify project requests.",
      angle: "Turn your Instagram audience into structured project requests.",
      message: "Hi [First name], your [project] is stunning. Do your Instagram followers have an easy way to request a project with you? Studio ATS gives designers a premium portfolio that captures and qualifies requests — room, surface, budget, timing. Happy to show you in 10 minutes.",
      searches: ["interior designer [city]", "décoratrice d’intérieur [city]", "#interiordesign [city]"],
    },
    {
      name: "Architectes d’intérieur",
      who: "Architectes d’intérieur et décorateurs sur des projets résidentiels ou hôteliers haut de gamme.",
      why: "Leur travail est visuel et leurs clients achètent sur la confiance et le goût.",
      problem: "Un bel Instagram, mais aucun moyen structuré de capter et qualifier les demandes.",
      angle: "Transformez votre audience Instagram en demandes de projets structurées.",
      message: "Bonjour [Prénom], votre projet [nom] est magnifique. Vos abonnés Instagram ont-ils un moyen simple de vous demander un projet ? Studio ATS offre aux architectes d’intérieur un portfolio premium qui capte et qualifie les demandes — pièce, surface, budget, délai. Je vous montre en 10 minutes ?",
      searches: ["architecte d’intérieur [ville]", "décoratrice d’intérieur [ville]", "#decorationinterieur [ville]"],
    }),
  m("renovation", "hammer", 6,
    {
      name: "Premium renovation companies",
      who: "Renovation companies focused on high-end homes and complete refurbishments.",
      why: "Large tickets, many unqualified quote requests.",
      problem: "Teams travel for site visits that don’t lead anywhere.",
      angle: "Qualify every project before the site visit — surface, budget, timing and photos upfront.",
      message: "Hello [First name], I saw your renovation in [place]. How many site visits a month end up going nowhere? Studio ATS shows your best projects and asks the right questions (surface, budget, timing, photos) before you move. Interested in seeing it?",
      searches: ["rénovation haut de gamme [city]", "renovation company [city]", "entreprise rénovation appartement [city]"],
    },
    {
      name: "Rénovation haut de gamme",
      who: "Entreprises de rénovation spécialisées dans les biens haut de gamme et les rénovations complètes.",
      why: "Des paniers élevés, beaucoup de demandes de devis non qualifiées.",
      problem: "Les équipes se déplacent pour des visites qui n’aboutissent pas.",
      angle: "Qualifiez chaque projet avant la visite — surface, budget, délai et photos en amont.",
      message: "Bonjour [Prénom], j’ai vu votre rénovation à [lieu]. Combien de visites par mois ne mènent à rien ? Studio ATS présente vos plus beaux chantiers et pose les bonnes questions (surface, budget, délai, photos) avant que vous vous déplaciez. Ça vous intéresse ?",
      searches: ["rénovation haut de gamme [ville]", "entreprise rénovation appartement [ville]", "rénovation maison ancienne [région]"],
    }),
  m("kitchen-designers", "kitchen", 7,
    {
      name: "Kitchen designers",
      who: "Kitchen showrooms and independent kitchen designers.",
      why: "High-value projects that start online and close in the showroom.",
      problem: "Showroom appointments are booked by phone, with little information about the project.",
      angle: "Get the showroom appointment booked with the project already described.",
      message: "Hi [First name], beautiful kitchens on your site. How do prospects book a showroom visit today? Studio ATS lets them describe their project and request an appointment online, so each visit is prepared. 10 minutes to show you?",
      searches: ["cuisiniste [city]", "kitchen showroom [city]", "custom kitchen designer [region]"],
    },
    {
      name: "Cuisinistes",
      who: "Showrooms de cuisine et concepteurs de cuisines indépendants.",
      why: "Des projets à forte valeur qui commencent en ligne et se concluent en showroom.",
      problem: "Les rendez-vous showroom sont pris par téléphone, avec peu d’informations sur le projet.",
      angle: "Obtenez le rendez-vous showroom avec le projet déjà décrit.",
      message: "Bonjour [Prénom], très belles cuisines sur votre site. Comment vos prospects réservent-ils une visite showroom aujourd’hui ? Studio ATS leur permet de décrire leur projet et de demander un rendez-vous en ligne : chaque visite est préparée. 10 minutes pour vous montrer ?",
      searches: ["cuisiniste [ville]", "cuisine sur mesure [ville]", "showroom cuisine [région]"],
    }),
  m("landscapers", "leaf", 8,
    {
      name: "Landscapers",
      who: "Landscape designers and garden-creation companies.",
      why: "Seasonal demand — capturing and qualifying requests early matters.",
      problem: "Requests peak in spring and many are too small or outside the service area.",
      angle: "Filter by area, surface and budget automatically, and fill your season with the right projects.",
      message: "Hello [First name], lovely garden in [place]. When spring requests arrive, how do you sort the good projects? Studio ATS qualifies each request (area, surface, budget) and books the visit. Want to see it?",
      searches: ["paysagiste [city]", "landscape designer [city]", "création jardin [region]"],
    },
    {
      name: "Paysagistes",
      who: "Paysagistes concepteurs et entreprises de création de jardins.",
      why: "Demande saisonnière — capter et qualifier tôt les demandes est clé.",
      problem: "Les demandes explosent au printemps et beaucoup sont trop petites ou hors zone.",
      angle: "Filtrez automatiquement par zone, surface et budget et remplissez votre saison avec les bons projets.",
      message: "Bonjour [Prénom], très beau jardin à [lieu]. Quand les demandes du printemps arrivent, comment triez-vous les bons projets ? Studio ATS qualifie chaque demande (zone, surface, budget) et programme la visite. Envie de voir ?",
      searches: ["paysagiste [ville]", "création jardin [ville]", "architecte paysagiste [région]"],
    }),
  m("pool-installers", "waves", 9,
    {
      name: "Pool installers",
      who: "Pool builders and installers for private homes.",
      why: "High-ticket projects with a long decision process.",
      problem: "Many quote requests, few serious projects, and no automatic follow-up.",
      angle: "Automatic follow-ups keep your quote top of mind during a long decision.",
      message: "Hi [First name], I saw your pool projects in [region]. How do you follow up quotes while clients decide? Studio ATS qualifies requests and sends automatic follow-ups so good projects don’t go cold. Shall I show you?",
      searches: ["pisciniste [city]", "pool builder [region]", "construction piscine [region]"],
    },
    {
      name: "Piscinistes",
      who: "Constructeurs et installateurs de piscines pour particuliers.",
      why: "Des projets à fort panier avec une décision longue.",
      problem: "Beaucoup de demandes de devis, peu de projets sérieux, et aucune relance automatique.",
      angle: "Les relances automatiques gardent votre devis en tête pendant une longue décision.",
      message: "Bonjour [Prénom], j’ai vu vos réalisations en [région]. Comment relancez-vous vos devis pendant que le client réfléchit ? Studio ATS qualifie les demandes et envoie des relances automatiques pour que les bons projets ne refroidissent pas. Je vous montre ?",
      searches: ["pisciniste [ville]", "construction piscine [région]", "piscine coque [région]"],
    }),
  m("b2b-consultants", "briefcase", 10,
    {
      name: "B2B consultants",
      who: "Independent consultants and boutique firms selling high-value engagements.",
      why: "Each engagement is significant; credibility and qualification drive the sale.",
      problem: "Lead generation relies on LinkedIn and referrals, with no structured intake.",
      angle: "Convert your LinkedIn visibility into qualified discovery calls.",
      message: "Hello [First name], I follow your posts on [topic]. When someone is interested, where do you send them? Studio ATS gives consultants a credible space that presents case studies, qualifies needs and books discovery calls. Worth 10 minutes?",
      searches: ["consultant [specialty] [city]", "cabinet de conseil [specialty]", "LinkedIn: consultant indépendant [specialty]"],
    },
    {
      name: "Consultants B2B",
      who: "Consultants indépendants et petits cabinets vendant des missions à forte valeur.",
      why: "Chaque mission compte ; crédibilité et qualification font la vente.",
      problem: "La prospection repose sur LinkedIn et le bouche-à-oreille, sans prise de contact structurée.",
      angle: "Transformez votre visibilité LinkedIn en appels découverte qualifiés.",
      message: "Bonjour [Prénom], je suis vos publications sur [sujet]. Quand quelqu’un est intéressé, où l’envoyez-vous ? Studio ATS donne aux consultants un espace crédible qui présente les cas clients, qualifie le besoin et programme l’appel découverte. Ça vaut 10 minutes ?",
      searches: ["consultant [spécialité] [ville]", "cabinet de conseil [spécialité]", "LinkedIn : consultant indépendant [spécialité]"],
    }),
  m("recruitment", "users", 11,
    {
      name: "Recruitment firms",
      who: "Boutique recruitment and executive-search firms.",
      why: "Winning a new client account has high value; trust is built before the first call.",
      problem: "Client and candidate requests mix together; client acquisition is manual.",
      angle: "Separate client and candidate journeys and qualify hiring needs automatically.",
      message: "Hi [First name], I noticed your firm specialises in [sector]. How do new client companies contact you today? Studio ATS separates client and candidate requests and qualifies hiring needs before the call. Open to a quick look?",
      searches: ["cabinet de recrutement [sector] [city]", "executive search [city]", "recruitment agency [niche]"],
    },
    {
      name: "Cabinets de recrutement",
      who: "Cabinets de recrutement spécialisés et chasseurs de têtes.",
      why: "Gagner un nouveau client a une forte valeur ; la confiance se construit avant l’appel.",
      problem: "Les demandes clients et candidats se mélangent ; l’acquisition client est manuelle.",
      angle: "Séparez les parcours clients et candidats et qualifiez les besoins de recrutement automatiquement.",
      message: "Bonjour [Prénom], votre cabinet est spécialisé en [secteur]. Comment les entreprises clientes vous contactent-elles aujourd’hui ? Studio ATS sépare les demandes clients et candidats et qualifie le besoin avant l’appel. Ouvert à un rapide aperçu ?",
      searches: ["cabinet de recrutement [secteur] [ville]", "chasseur de têtes [ville]", "recrutement [niche]"],
    }),
  m("event-professionals", "sparkles", 12,
    {
      name: "Premium event professionals",
      who: "Caterers, venues, event agencies, florists and decorators working on premium events.",
      why: "Each event is a high-value booking with a date that can only be sold once.",
      problem: "Availability, guest count and budget are exchanged over many messages.",
      angle: "Capture date, guest count and budget in the first request — answer only the right events.",
      message: "Hello [First name], your [event] setup was superb. How do clients check availability with you today? Studio ATS captures date, guests and budget in the first request and books the call. Want to see it?",
      searches: ["traiteur événementiel [city]", "lieu de réception [city]", "event agency [city]"],
    },
    {
      name: "Événementiel premium",
      who: "Traiteurs, lieux de réception, agences événementielles, fleuristes et décorateurs haut de gamme.",
      why: "Chaque événement est une réservation à forte valeur sur une date qu’on ne vend qu’une fois.",
      problem: "Disponibilité, nombre d’invités et budget s’échangent en de nombreux messages.",
      angle: "Captez date, invités et budget dès la première demande — ne répondez qu’aux bons événements.",
      message: "Bonjour [Prénom], votre mise en place pour [événement] était superbe. Comment vos clients vérifient-ils vos disponibilités aujourd’hui ? Studio ATS capte date, invités et budget dès la première demande et programme l’appel. Envie de voir ?",
      searches: ["traiteur événementiel [ville]", "lieu de réception [ville]", "agence événementielle [ville]"],
    }),
];

export const defaultMarkets: Market[] = [...salesTargets, ...baseMarkets].map((market) => ({
  ...market,
  content: { ...market.content, ...marketTranslations(market.slug) },
}));

export function marketContent(market: Market, locale: Locale): MarketContent {
  return market.content[locale] ?? market.content.en;
}
