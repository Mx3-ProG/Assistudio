import type { Locale } from "@/i18n/config";

export type BriefField = {
  key: string;
  type: "text" | "email" | "tel" | "date" | "textarea" | "checkboxes";
  label: { en: string; fr: string };
  options?: string[];
  required?: boolean;
};

export type BriefSection = {
  id: string;
  title: string;
  description: string;
  fields: BriefField[];
};

const titleSets: Record<Locale, string[]> = {
  en: ["Project", "Identity & objectives", "Visual identity", "Content & pages", "Catalog", "Administration & team", "Advanced modules", "Automations & integrations", "Data & compliance", "Business rules", "Priorities & timing", "Scope validation"],
  fr: ["Projet", "Identité & objectifs", "Identité visuelle", "Contenus & pages", "Catalogue", "Administration & équipe", "Modules avancés", "Automatisations & intégrations", "Données & conformité", "Règles métier", "Priorités & délais", "Validation du périmètre"],
  de: ["Projekt", "Identität & Ziele", "Visuelle Identität", "Inhalte & Seiten", "Katalog", "Verwaltung & Team", "Erweiterte Module", "Automatisierungen & Integrationen", "Daten & Compliance", "Geschäftsregeln", "Prioritäten & Termine", "Umfangsbestätigung"],
  es: ["Proyecto", "Identidad y objetivos", "Identidad visual", "Contenidos y páginas", "Catálogo", "Administración y equipo", "Módulos avanzados", "Automatizaciones e integraciones", "Datos y conformidad", "Reglas de negocio", "Prioridades y plazos", "Validación del alcance"],
  pt: ["Projeto", "Identidade e objetivos", "Identidade visual", "Conteúdos e páginas", "Catálogo", "Administração e equipa", "Módulos avançados", "Automações e integrações", "Dados e conformidade", "Regras de negócio", "Prioridades e prazos", "Validação do âmbito"],
  it: ["Progetto", "Identità e obiettivi", "Identità visiva", "Contenuti e pagine", "Catalogo", "Amministrazione e team", "Moduli avanzati", "Automazioni e integrazioni", "Dati e conformità", "Regole aziendali", "Priorità e tempi", "Convalida dell'ambito"],
  nl: ["Project", "Identiteit & doelen", "Visuele identiteit", "Inhoud & pagina's", "Catalogus", "Beheer & team", "Geavanceerde modules", "Automatiseringen & integraties", "Gegevens & naleving", "Bedrijfsregels", "Prioriteiten & planning", "Validatie van de scope"],
  ar: ["المشروع", "الهوية والأهداف", "الهوية البصرية", "المحتوى والصفحات", "الكتالوج", "الإدارة والفريق", "الوحدات المتقدمة", "الأتمتة والتكامل", "البيانات والامتثال", "قواعد العمل", "الأولويات والمواعيد", "اعتماد النطاق"],
};

const f = (key: string, type: BriefField["type"], en: string, fr: string, required = false, options?: string[]): BriefField =>
  ({ key, type, label: { en, fr }, required, options });

const definitions: Omit<BriefSection, "title">[] = [
  { id: "project", description: "Core project information", fields: [
    f("project.company", "text", "Company / client", "Client / société", true),
    f("project.name", "text", "Project name", "Nom du projet", true),
    f("project.domain", "text", "Domain name", "Nom de domaine"),
    f("project.contact", "text", "Main contact", "Contact principal", true),
    f("project.phone", "tel", "Phone", "Téléphone"),
  ] },
  { id: "identity", description: "Business context and conversion goal", fields: [
    f("identity.brand", "text", "Brand name", "Nom commercial / marque", true),
    f("identity.activity", "textarea", "Describe your business", "Décrivez votre activité", true),
    f("identity.market", "text", "Target market and area", "Marché et zone géographique"),
    f("identity.audience", "textarea", "Who are your customers?", "À qui vous adressez-vous ?"),
    f("identity.goal", "textarea", "Primary website objective", "Objectif principal du site", true),
    f("identity.actions", "checkboxes", "Expected visitor actions", "Actions attendues du visiteur", false, ["quote", "appointment", "buy", "call", "message", "account", "catalog", "discover"]),
    f("identity.competitors", "textarea", "Competitors and references", "Concurrents et références"),
  ] },
  { id: "visual", description: "Brand assets and artistic direction", fields: [
    f("visual.assets", "checkboxes", "Available assets", "Éléments disponibles", false, ["logo", "guidelines", "colors", "fonts", "photos", "videos", "icons", "none"]),
    f("visual.colors", "text", "Preferred colors", "Couleurs souhaitées"),
    f("visual.mood", "checkboxes", "Desired mood", "Ambiance recherchée", false, ["institutional", "premium", "minimal", "technology", "creative", "warm", "dynamic", "immersive"]),
    f("visual.mode", "checkboxes", "Display preference", "Préférence d'affichage", false, ["light", "dark", "both", "studio_choice"]),
    f("visual.references", "textarea", "Sites you like", "Sites dont vous appréciez le style"),
    f("visual.avoid", "textarea", "Styles to avoid", "Styles à éviter"),
  ] },
  { id: "content", description: "Site map, messages and supplied content", fields: [
    f("content.pages", "checkboxes", "Required pages", "Pages souhaitées", false, ["home", "about", "services", "catalog", "product", "contact", "faq", "blog", "portfolio", "booking", "account", "checkout", "legal"]),
    f("content.tagline", "text", "Main tagline", "Slogan principal"),
    f("content.value", "textarea", "Value proposition", "Proposition de valeur", true),
    f("content.services", "textarea", "Main services", "Services principaux"),
    f("content.cta", "text", "Primary call to action", "Appel à l'action principal"),
    f("content.supplied", "checkboxes", "Content supplied by client", "Contenus fournis", false, ["texts", "photos", "videos", "prices", "testimonials", "faq", "pdf", "products", "needs_creation"]),
  ] },
  { id: "catalog", description: "Products, services and initial import", fields: [
    f("catalog.type", "checkboxes", "Catalog type", "Type de catalogue", false, ["none", "services", "products", "mixed"]),
    f("catalog.count", "text", "Approximate number of items", "Nombre approximatif de références"),
    f("catalog.fields", "checkboxes", "Information per item", "Informations par référence", false, ["name", "summary", "description", "photos", "price", "quote_only", "sku", "category", "variants", "stock", "documents"]),
    f("catalog.import", "checkboxes", "Initial import", "Import initial", false, ["manual", "csv", "excel", "old_site", "api", "unknown"]),
    f("catalog.details", "textarea", "Catalog details", "Précisions catalogue"),
  ] },
  { id: "team", description: "Back-office users and permissions", fields: [
    f("team.manage", "checkboxes", "Dashboard management needs", "Éléments à gérer", false, ["pages", "products", "prices", "stock", "orders", "customers", "appointments", "promotions", "users", "media", "blog", "analytics"]),
    f("team.admin", "text", "Main administrator", "Administrateur principal"),
    f("team.members", "textarea", "Other team members", "Autres membres de l'équipe"),
    f("team.roles", "checkboxes", "Required roles", "Rôles souhaités", false, ["admin", "moderator", "sales", "catalog", "support", "accounting"]),
  ] },
  { id: "modules", description: "Advanced modules shown only when selected", fields: [
    f("modules.enabled", "checkboxes", "Required modules", "Modules nécessaires", false, ["ecommerce", "accounts", "crm", "booking", "affiliation", "stock"]),
    f("modules.details", "textarea", "Expected module behaviour", "Fonctionnement attendu des modules"),
  ] },
  { id: "automation", description: "Triggers, actions and connected tools", fields: [
    f("automation.triggers", "checkboxes", "Triggers", "Événements déclencheurs", false, ["form", "lead", "appointment", "order", "payment", "account", "stock", "status"]),
    f("automation.actions", "checkboxes", "Automated actions", "Actions automatiques", false, ["client_email", "team_email", "crm", "stock", "task", "document", "webhook", "followup"]),
    f("automation.primary", "textarea", "Describe the most important automation", "Décrivez l'automatisation principale"),
    f("automation.integrations", "checkboxes", "External integrations", "Intégrations externes", false, ["stripe", "resend", "calendar", "maps", "crm", "erp", "shipping", "social", "api"]),
    f("automation.software", "textarea", "Existing software and APIs", "Logiciels et API existants"),
  ] },
  { id: "compliance", description: "Infrastructure, personal data and legal documents", fields: [
    f("compliance.infrastructure", "checkboxes", "Existing infrastructure", "Infrastructure existante", false, ["domain", "email", "database", "old_site", "analytics", "none"]),
    f("compliance.provider", "text", "Current host / registrar", "Hébergeur / registrar"),
    f("compliance.data", "checkboxes", "Personal data collected", "Données personnelles collectées", false, ["identity", "email", "phone", "address", "account", "orders", "payments", "booking", "documents"]),
    f("compliance.legal", "checkboxes", "Legal documents available", "Documents juridiques disponibles", false, ["legal_notice", "terms", "privacy", "cookies", "needs_help"]),
    f("compliance.constraints", "textarea", "Security or confidentiality constraints", "Contraintes de sécurité ou confidentialité"),
  ] },
  { id: "rules", description: "Real operational journey and exceptions", fields: [
    f("rules.journey", "textarea", "Visitor-to-customer journey", "Parcours du visiteur jusqu'au client", true),
    f("rules.contact", "textarea", "What happens after an enquiry?", "Que se passe-t-il après une demande ?"),
    f("rules.payment", "textarea", "What happens after an order or payment?", "Que se passe-t-il après une commande ou un paiement ?"),
    f("rules.delivery", "textarea", "What happens after delivery?", "Que se passe-t-il après la livraison ?"),
    f("rules.exceptions", "textarea", "Exceptions and manual validations", "Exceptions et validations manuelles"),
  ] },
  { id: "priorities", description: "Launch target and missing inputs", fields: [
    f("priorities.level", "checkboxes", "Project priority", "Priorité du projet", false, ["fast", "balanced", "custom"]),
    f("priorities.launch", "date", "Desired launch date", "Date de mise en ligne souhaitée"),
    f("priorities.event", "textarea", "Related deadline or event", "Échéance ou événement lié"),
    f("priorities.missing", "checkboxes", "Still to provide", "Éléments encore à fournir", false, ["logo", "texts", "photos", "videos", "products", "domain", "old_site", "legal", "api_keys"]),
    f("priorities.must_have", "textarea", "Three launch essentials", "Trois indispensables au lancement", true),
    f("priorities.later", "textarea", "Features that can wait", "Fonctions pouvant attendre"),
  ] },
  { id: "validation", description: "Client confirmation before affiliate review", fields: [
    f("validation.confirmations", "checkboxes", "I confirm", "Je confirme", true, ["reviewed", "priorities_correct", "out_of_scope_quote", "provide_content", "share_with_affiliate"]),
    f("validation.comment", "textarea", "Final comment", "Commentaire final"),
  ] },
];

export function briefSections(locale: Locale): BriefSection[] {
  return definitions.map((section, index) => ({ ...section, title: titleSets[locale][index] }));
}

export function fieldLabel(field: BriefField, locale: Locale): string {
  return locale === "fr" ? field.label.fr : field.label.en;
}

export const DOSSIER_STATUS_LABELS: Record<Locale, Record<string, string>> = Object.fromEntries(
  (Object.keys(titleSets) as Locale[]).map((locale) => [locale, {
    draft: locale === "fr" ? "Brouillon" : "Draft",
    awaiting_client: locale === "fr" ? "En attente du client" : "Waiting for client",
    affiliate_review: locale === "fr" ? "Relecture affilié" : "Affiliate review",
    admin_review: locale === "fr" ? "Validation admin" : "Admin review",
    awaiting_client_acceptance: locale === "fr" ? "Acceptation client" : "Client acceptance",
    awaiting_studio_acceptance: locale === "fr" ? "Contresignature Studio ATS" : "Studio ATS countersignature",
    awaiting_payment: locale === "fr" ? "Paiement attendu" : "Waiting for payment",
    active: locale === "fr" ? "Actif" : "Active",
    changes_requested: locale === "fr" ? "Corrections demandées" : "Changes requested",
    declined: locale === "fr" ? "Refusé" : "Declined",
    expired: locale === "fr" ? "Expiré" : "Expired",
    cancelled: locale === "fr" ? "Annulé" : "Cancelled",
  }]),
) as unknown as Record<Locale, Record<string, string>>;
