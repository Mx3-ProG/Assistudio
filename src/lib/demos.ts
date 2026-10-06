import type { OfferTier } from "./offers.ts";

export const studioDemoTiers = ["one", "pro", "premium"] as const satisfies readonly OfferTier[];

export const studioDemos = [
  {
    slug: "ines-conciergerie",
    title: "Inès Darges",
    category: "Conciergerie privée",
    description: "Une vitrine premium, éditoriale et rassurante pour transformer une prestation locale en expérience de marque.",
    descriptionEn: "A premium editorial showcase that turns a local service into a distinctive brand experience.",
    href: "/demo-sites/ines/index.html",
    tier: "one",
    adminHref: null,
    accent: "sand",
    highlights: ["Site multipage", "Prise de contact simulée", "Responsive"],
    highlightsEn: ["Multi-page website", "Simulated enquiries", "Responsive"],
  },
  {
    slug: "vortex-r",
    title: "Vortex R",
    category: "Expérience produit 3D",
    description: "Une présentation automobile cinématique pilotée au scroll, avec modèle 3D interactif et narration technique.",
    descriptionEn: "A scroll-driven cinematic automotive presentation with an interactive 3D model and technical storytelling.",
    href: "/demo-sites/vortex/index.html",
    tier: "one",
    adminHref: null,
    accent: "red",
    highlights: ["WebGL 3D", "Scrollytelling", "Interactions produit"],
    highlightsEn: ["WebGL 3D", "Scroll storytelling", "Product interactions"],
  },
  {
    slug: "wild-haven",
    title: "Wild Haven",
    category: "Hôtellerie de plein air",
    description: "Un parcours immersif de découverte et de réservation, alimenté exclusivement par des données de démonstration locales.",
    descriptionEn: "An immersive discovery and booking journey powered entirely by local demonstration data.",
    href: "/demo-sites/camping/index.html",
    tier: "one",
    adminHref: null,
    accent: "forest",
    highlights: ["Catalogue filtrable", "Réservation simulée", "Données locales"],
    highlightsEn: ["Filterable catalogue", "Simulated booking", "Local data"],
  },
  {
    slug: "isabelle-rouxel",
    title: "Isabelle Rouxel",
    category: "Thérapeute & hypnose",
    description: "Un site professionnel complet avec contenus éditoriaux, FAQ, contact et parcours de réservation simulé sur plusieurs étapes.",
    descriptionEn: "A complete professional website with editorial content, FAQs, contact and a simulated multi-step booking journey.",
    href: "/demo-sites/isabelle-rouxel/index.html",
    tier: "pro",
    adminHref: "/demo-sites/isabelle-rouxel/admin/index.html#/",
    accent: "sage",
    highlights: ["Site multipage", "Réservation simulée", "Dashboard admin", "Données locales"],
    highlightsEn: ["Multi-page website", "Simulated booking", "Admin dashboard", "Local data"],
  },
  {
    slug: "garage-du-lac",
    title: "Garage Du Lac",
    category: "Atelier automobile",
    description: "Une vitrine automobile multilingue avec catalogue de prestations, devis interactif et contenu commercial structuré.",
    descriptionEn: "A multilingual automotive showcase with a service catalogue, interactive quote request and structured sales content.",
    href: "/demo-sites/garage-du-lac/index.html",
    tier: "pro",
    adminHref: "/demo-sites/garage-du-lac/admin/login.html",
    accent: "steel",
    highlights: ["Multilingue", "Catalogue dynamique", "Devis simulé", "Dashboard admin"],
    highlightsEn: ["Multilingual", "Dynamic catalogue", "Simulated quote", "Admin dashboard"],
  },
  {
    slug: "instant-precieux",
    title: "L'instant précieux",
    category: "Photographie & direction artistique",
    description: "Un portfolio immersif et multilingue avec galeries, offres, demande de devis et parcours de réservation sans paiement réel.",
    descriptionEn: "An immersive multilingual portfolio with galleries, offers, quote requests and a booking journey without real payments.",
    href: "/demo-sites/instant-precieux/index.html",
    tier: "pro",
    adminHref: "/demo-sites/instant-precieux/index.html#/admin",
    accent: "pearl",
    highlights: ["Portfolio immersif", "FR / EN / DE", "Parcours commercial", "Dashboard admin"],
    highlightsEn: ["Immersive portfolio", "FR / EN / DE", "Sales journey", "Admin dashboard"],
  },
  {
    slug: "cadence-mada",
    title: "Cadence",
    category: "Agenda & rendez-vous",
    description: "Un espace de pilotage hebdomadaire avec contacts, rendez-vous, confirmations et statistiques, manipulable avec des données fictives locales.",
    descriptionEn: "A weekly operations workspace for contacts, appointments, confirmations and analytics, powered by local demo data.",
    href: "/demo-sites/cadence-mada/index.html#/fr/dashboard",
    tier: "premium",
    adminHref: null,
    accent: "cadence",
    highlights: ["Agenda interactif", "Gestion des statuts", "Statistiques métier", "Données locales"],
    highlightsEn: ["Interactive calendar", "Status management", "Business analytics", "Local data"],
  },
  {
    slug: "customer-mada",
    title: "Mada Customer",
    category: "Portefeuille & santé client",
    description: "Un CRM visuel pour suivre la rentabilité, les paiements, les interactions et le niveau de risque de chaque compte client.",
    descriptionEn: "A visual CRM for tracking profitability, payments, interactions and the risk level of every customer account.",
    href: "/demo-sites/customer-mada/index.html#/dashboard",
    tier: "premium",
    adminHref: null,
    accent: "customer",
    highlights: ["Score de santé", "Fiches clients éditables", "Recherche & export", "Données locales"],
    highlightsEn: ["Health scoring", "Editable customer records", "Search & export", "Local data"],
  },
  {
    slug: "mada-supply",
    title: "Mada Supply",
    category: "Infrastructure & opérations",
    description: "Une tour de contrôle réseau avec cartographie mondiale, flux temps réel simulés, incidents et éditeurs d'infrastructure.",
    descriptionEn: "A network control tower with a global map, simulated live traffic, incidents and infrastructure editors.",
    href: "/demo-sites/mada-supply/index.html#/",
    tier: "premium",
    adminHref: null,
    accent: "supply",
    highlights: ["Carte réseau interactive", "Simulation d'incidents", "Infrastructure éditable", "Aucun service réel"],
    highlightsEn: ["Interactive network map", "Incident simulation", "Editable infrastructure", "No live services"],
  },
] as const;

export type StudioDemo = (typeof studioDemos)[number];

export function getStudioDemo(slug: string) {
  return studioDemos.find((demo) => demo.slug === slug);
}

/**
 * The demos featured in "See it, then test it" (src/components/proof/case-studies.tsx):
 * those with a front AND an admin side first. The demo gallery excludes them so
 * a demo never appears twice on the same page.
 */
export function featuredDemos(limit = 3): StudioDemo[] {
  return [...studioDemos].sort((a, b) => Number(!!b.adminHref) - Number(!!a.adminHref)).slice(0, limit);
}
