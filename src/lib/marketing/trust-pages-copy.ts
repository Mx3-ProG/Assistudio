import type { Locale } from "@/i18n/config";

type Card = { title: string; body: string };
type Step = Card & { label: string };

export type AboutPageCopy = {
  eyebrow: string; title: string; intro: string; primary: string; secondary: string;
  originEyebrow: string; originTitle: string; originLead: string; originBody: string;
  productEyebrow: string; productTitle: string; productBody: string; pillars: Card[];
  journeyEyebrow: string; journeyTitle: string; journeyBody: string; journey: Step[];
  modelEyebrow: string; modelTitle: string; modelBody: string; modelPoints: string[];
  principlesEyebrow: string; principlesTitle: string; principles: Card[];
  futureEyebrow: string; futureTitle: string; futureBody: string;
  finalTitle: string; finalBody: string; finalPrimary: string; finalSecondary: string;
};

export type SecurityPageCopy = {
  eyebrow: string; title: string; intro: string; primary: string; secondary: string;
  postureEyebrow: string; postureTitle: string; postureBody: string; controls: Card[];
  dataEyebrow: string; dataTitle: string; dataBody: string; dataPoints: Card[];
  paymentsEyebrow: string; paymentsTitle: string; paymentsBody: string; paymentPoints: string[];
  responsibilityEyebrow: string; responsibilityTitle: string; responsibilityBody: string; responsibilities: Card[];
  incidentEyebrow: string; incidentTitle: string; incidentBody: string; incidentSteps: Step[];
  finalTitle: string; finalBody: string; finalPrimary: string; finalSecondary: string;
};

const aboutEn: AboutPageCopy = {
  eyebrow: "About Studio ATS", title: "Building the commercial infrastructure small teams deserve.",
  intro: "Studio ATS brings together presence, enquiries, qualification, appointments, contacts, follow-ups and measurement in one coherent system — built and operated by a real team.",
  primary: "See Studio in action", secondary: "Talk about my project",
  originEyebrow: "Why Studio exists", originTitle: "A business should not lose opportunities between disconnected tools.",
  originLead: "High-value service professionals are expected to look credible, answer quickly and follow every opportunity — without having an in-house digital team.",
  originBody: "A static website stops when the form is submitted. Generic software adds another dashboard to manage. Studio was created to connect the whole journey and give one team responsibility for making it work.",
  productEyebrow: "What we are building", productTitle: "A Studio is not a web page. It is a commercial system.",
  productBody: "One, Pro and Premium are three levels of support around the same idea: a digital environment that presents the business, turns interest into action and remains useful after launch.",
  pillars: [
    { title: "Presence", body: "A fast, distinctive and credible experience that explains the offer without jargon." },
    { title: "Conversion", body: "Forms, qualification and booking flows designed around the way the business really sells." },
    { title: "Operations", body: "Contacts, requests, appointments and follow-ups gathered in a usable workspace." },
    { title: "Steering", body: "Clear signals to understand what is viewed, requested and worth improving." },
  ],
  journeyEyebrow: "The customer journey", journeyTitle: "From first impression to a follow-up nobody forgets.",
  journeyBody: "Every step has a clear job. The experience is designed for the visitor and the team that will handle the enquiry.",
  journey: [
    { label: "01", title: "Discover", body: "The visitor understands the value, the work and the next step." },
    { label: "02", title: "Explain", body: "A structured request captures the useful context, not just an email address." },
    { label: "03", title: "Book", body: "The right person chooses a suitable time or receives a clear response." },
    { label: "04", title: "Follow", body: "The request, history and next action remain visible in the same system." },
  ],
  modelEyebrow: "How we operate", modelTitle: "Technology operated by people, not a site generator left on its own.",
  modelBody: "The Studio team scopes, designs, builds, launches and supports the work according to the chosen offer. Our partner network introduces relevant businesses; it does not replace the team responsible for delivery.",
  modelPoints: ["A real need before a feature", "A visible scope before production", "An owner for every delivery", "Continuous improvements after launch"],
  principlesEyebrow: "Our principles", principlesTitle: "Useful before impressive. Proof before promises.",
  principles: [
    { title: "Built around the work", body: "We begin with how clients arrive, decide and are served — not with a fashionable template." },
    { title: "No invented results", body: "Demonstrations are identified as such. Figures and testimonials only appear when documented and authorised." },
    { title: "Ownership and clarity", body: "The scope, access, data and responsibilities are explained before the project starts." },
    { title: "Designed to evolve", body: "A Studio should become more useful as the business learns, not become obsolete after launch." },
  ],
  futureEyebrow: "Where we are going", futureTitle: "The digital operating layer for service businesses.",
  futureBody: "Our long-term direction is simple: let independents and small companies access the quality of execution, continuity and connected tools normally reserved for larger organisations — without inheriting their complexity.",
  finalTitle: "Let us build the system behind your next client.", finalBody: "Show us how your business works today. We will tell you plainly what Studio can improve, what it should keep and which offer makes sense.",
  finalPrimary: "Discover Studio", finalSecondary: "Contact the team",
};

const securityEn: SecurityPageCopy = {
  eyebrow: "Security at Studio ATS", title: "Trust is part of the product, not a paragraph added at the end.",
  intro: "Studio handles commercial data, customer requests and payment events. We design access, storage and operations so that each person sees only what they need and sensitive actions remain traceable.",
  primary: "Discuss my project", secondary: "Privacy policy",
  postureEyebrow: "Our approach", postureTitle: "Several controls, each with a precise role.",
  postureBody: "No single control is presented as infallible. Isolation, server-side checks, restricted secrets, signed events and audit trails work together to reduce risk.",
  controls: [
    { title: "Access isolation", body: "Database row-level rules separate accounts and restrict private records to authorised roles." },
    { title: "Verified identity", body: "Short-lived, single-use login codes are stored as keyed hashes rather than usable codes." },
    { title: "Restricted operations", body: "Privileged credentials remain server-side and are used only by narrowly scoped services." },
    { title: "Traceable actions", body: "Sensitive financial and administrative changes create records that can be investigated." },
  ],
  dataEyebrow: "Data protection", dataTitle: "Collect what is useful. Restrict who can reach it.",
  dataBody: "Commercial information is separated by account and purpose. Public forms do not turn private customer records into public data, and tracking identifiers are minimised or hashed where appropriate.",
  dataPoints: [
    { title: "In transit", body: "Production traffic uses encrypted HTTPS connections provided by the hosting platform." },
    { title: "In the database", body: "Access policies are applied close to the data, in addition to checks in the application." },
    { title: "In the team", body: "Administrative access is reserved for authorised operational needs." },
    { title: "In your hands", body: "You keep control of the business information and contacts entrusted to your Studio." },
  ],
  paymentsEyebrow: "Payments", paymentsTitle: "Card details stay with the payment specialist.",
  paymentsBody: "Checkout and sensitive banking onboarding are hosted by Stripe. Studio receives signed events and the operational references needed to confirm a payment, refund or dispute; it does not store card or bank account details.",
  paymentPoints: ["Webhook signatures are verified before processing", "Duplicate payment events are handled idempotently", "Financial state changes are logged", "A payment is confirmed only after the provider confirms it"],
  responsibilityEyebrow: "Shared responsibility", responsibilityTitle: "Security also depends on clear operating habits.",
  responsibilityBody: "We secure the platform and the services we operate. Customers and partners also protect their mailbox, devices and authorised access. The safest system is one whose responsibilities are understood.",
  responsibilities: [
    { title: "Studio ATS", body: "Platform access, application updates, service configuration and investigation of reported incidents." },
    { title: "Customers", body: "Accurate user access, protected email accounts and prompt reporting of suspicious activity." },
    { title: "Providers", body: "Hosting, database and payment infrastructure within their respective security programmes." },
  ],
  incidentEyebrow: "If something looks wrong", incidentTitle: "A direct path from report to resolution.",
  incidentBody: "Security reports are treated separately from ordinary commercial questions so that the team can qualify the issue and limit exposure quickly.",
  incidentSteps: [
    { label: "01", title: "Report", body: "Send the affected page, time and observable behaviour without including passwords or card details." },
    { label: "02", title: "Contain", body: "We assess the scope and restrict the affected access or operation when necessary." },
    { label: "03", title: "Correct", body: "The cause is fixed, relevant evidence is preserved and affected parties are informed when required." },
  ],
  finalTitle: "Have a security or privacy question?", finalBody: "Describe the context and the Studio team will route it to the right person. Never send a password, login code or payment card number.",
  finalPrimary: "Contact Studio ATS", finalSecondary: "Read the privacy policy",
};

const fr: { about: AboutPageCopy; security: SecurityPageCopy } = {
  about: {
    ...aboutEn,
    eyebrow: "À propos de Studio ATS", title: "Construire l’infrastructure commerciale que les petites équipes méritent.",
    intro: "Studio ATS réunit présence en ligne, demandes, qualification, rendez-vous, contacts, relances et mesure dans un même système cohérent — construit et opéré par une vraie équipe.",
    primary: "Voir Studio en action", secondary: "Parler de mon projet",
    originEyebrow: "Pourquoi Studio existe", originTitle: "Une entreprise ne devrait pas perdre des opportunités entre des outils déconnectés.",
    originLead: "On demande aux professionnels de services à forte valeur d’être crédibles, réactifs et de suivre chaque opportunité — sans leur donner une équipe numérique interne.",
    originBody: "Un site statique s’arrête quand le formulaire est envoyé. Un logiciel générique ajoute encore un tableau de bord à gérer. Studio relie tout le parcours et confie à une même équipe la responsabilité de le faire fonctionner.",
    productEyebrow: "Ce que nous produisons", productTitle: "Un Studio n’est pas une page web. C’est un système commercial.",
    productBody: "One, Pro et Premium sont trois niveaux d’accompagnement autour d’une même idée : un environnement numérique qui présente l’activité, transforme l’intérêt en action et reste utile après le lancement.",
    pillars: [
      { title: "Présence", body: "Une expérience rapide, distinctive et crédible qui explique l’offre sans jargon." },
      { title: "Conversion", body: "Des formulaires, une qualification et des rendez-vous adaptés à la façon dont l’entreprise vend réellement." },
      { title: "Opérations", body: "Contacts, demandes, rendez-vous et relances réunis dans un espace exploitable." },
      { title: "Pilotage", body: "Des signaux clairs pour comprendre ce qui est vu, demandé et mérite d’être amélioré." },
    ],
    journeyEyebrow: "Le parcours client", journeyTitle: "Du premier regard au suivi que personne n’oublie.",
    journeyBody: "Chaque étape a une fonction claire. L’expérience est pensée pour le visiteur comme pour l’équipe qui traitera sa demande.",
    journey: [
      { label: "01", title: "Découvrir", body: "Le visiteur comprend la valeur, les réalisations et la prochaine action." },
      { label: "02", title: "Expliquer", body: "Une demande structurée capture le contexte utile, pas seulement une adresse email." },
      { label: "03", title: "Réserver", body: "La bonne personne choisit un créneau adapté ou reçoit une réponse claire." },
      { label: "04", title: "Suivre", body: "La demande, l’historique et la prochaine action restent visibles dans le même système." },
    ],
    modelEyebrow: "Notre fonctionnement", modelTitle: "Une technologie opérée par des humains, pas un générateur de site laissé seul.",
    modelBody: "L’équipe Studio cadre, conçoit, construit, met en ligne et accompagne le projet selon l’offre choisie. Notre réseau de partenaires présente Studio aux entreprises pertinentes ; il ne remplace jamais l’équipe responsable de la livraison.",
    modelPoints: ["Un besoin réel avant une fonctionnalité", "Un périmètre visible avant la production", "Un responsable pour chaque livraison", "Des améliorations continues après la mise en ligne"],
    principlesEyebrow: "Nos principes", principlesTitle: "Utile avant d’être spectaculaire. La preuve avant la promesse.",
    principles: [
      { title: "Partir du métier", body: "Nous commençons par la façon dont les clients arrivent, décident et sont servis — pas par un modèle à la mode." },
      { title: "Aucun résultat inventé", body: "Les démonstrations sont signalées. Chiffres et témoignages n’apparaissent que s’ils sont documentés et autorisés." },
      { title: "Propriété et clarté", body: "Le périmètre, les accès, les données et les responsabilités sont expliqués avant le démarrage." },
      { title: "Conçu pour évoluer", body: "Un Studio doit devenir plus utile à mesure que l’entreprise apprend, pas devenir obsolète après sa mise en ligne." },
    ],
    futureEyebrow: "Notre cap", futureTitle: "Devenir la couche opérationnelle numérique des métiers de service.",
    futureBody: "Notre direction à long terme est simple : donner aux indépendants et petites entreprises la qualité d’exécution, la continuité et les outils connectés habituellement réservés aux grandes structures — sans hériter de leur complexité.",
    finalTitle: "Construisons le système derrière votre prochain client.", finalBody: "Montrez-nous comment votre activité fonctionne aujourd’hui. Nous vous dirons franchement ce que Studio peut améliorer, ce qu’il doit conserver et quelle offre a du sens.",
    finalPrimary: "Découvrir Studio", finalSecondary: "Contacter l’équipe",
  },
  security: {
    ...securityEn,
    eyebrow: "La sécurité chez Studio ATS", title: "La confiance fait partie du produit, ce n’est pas un paragraphe ajouté à la fin.",
    intro: "Studio traite des données commerciales, des demandes clients et des événements de paiement. Nous concevons les accès, le stockage et les opérations pour que chacun ne voie que le nécessaire et que les actions sensibles restent traçables.",
    primary: "Parler de mon projet", secondary: "Politique de confidentialité",
    postureEyebrow: "Notre approche", postureTitle: "Plusieurs contrôles, chacun avec un rôle précis.",
    postureBody: "Aucun contrôle n’est présenté comme infaillible. Isolation, vérifications serveur, secrets restreints, événements signés et journaux d’audit se complètent pour réduire le risque.",
    controls: [
      { title: "Isolation des accès", body: "Des règles au niveau des lignes de la base séparent les comptes et réservent les données privées aux rôles autorisés." },
      { title: "Identité vérifiée", body: "Les codes de connexion à usage unique et durée limitée sont stockés sous forme de condensats sécurisés, jamais comme codes utilisables." },
      { title: "Opérations restreintes", body: "Les identifiants privilégiés restent côté serveur et ne servent qu’à des services au périmètre limité." },
      { title: "Actions traçables", body: "Les changements financiers et administratifs sensibles produisent des traces exploitables en cas d’enquête." },
    ],
    dataEyebrow: "Protection des données", dataTitle: "Collecter l’utile. Restreindre qui peut y accéder.",
    dataBody: "Les informations commerciales sont séparées par compte et par finalité. Les formulaires publics ne rendent pas les dossiers clients publics ; les identifiants de suivi sont minimisés ou hachés lorsque c’est pertinent.",
    dataPoints: [
      { title: "En transit", body: "En production, les échanges passent par des connexions HTTPS chiffrées fournies par la plateforme d’hébergement." },
      { title: "Dans la base", body: "Les politiques d’accès s’appliquent au plus près des données, en plus des contrôles de l’application." },
      { title: "Dans l’équipe", body: "L’accès administratif est réservé aux besoins opérationnels autorisés." },
      { title: "Entre vos mains", body: "Vous gardez le contrôle des informations métier et des contacts confiés à votre Studio." },
    ],
    paymentsEyebrow: "Paiements", paymentsTitle: "Les données bancaires restent chez le spécialiste du paiement.",
    paymentsBody: "Le paiement et l’onboarding bancaire sensible sont hébergés par Stripe. Studio reçoit des événements signés et les références nécessaires pour confirmer paiement, remboursement ou litige ; il ne stocke ni numéro de carte ni coordonnées bancaires.",
    paymentPoints: ["La signature des webhooks est vérifiée avant traitement", "Les événements en double sont traités de façon idempotente", "Les changements d’état financier sont journalisés", "Un paiement n’est confirmé qu’après confirmation du prestataire"],
    responsibilityEyebrow: "Responsabilité partagée", responsibilityTitle: "La sécurité dépend aussi d’habitudes d’exploitation claires.",
    responsibilityBody: "Nous sécurisons la plateforme et les services que nous opérons. Clients et partenaires protègent aussi leur messagerie, leurs appareils et leurs accès autorisés. Le système le plus sûr est celui dont chacun comprend les responsabilités.",
    responsibilities: [
      { title: "Studio ATS", body: "Accès à la plateforme, mises à jour applicatives, configuration des services et enquête sur les incidents signalés." },
      { title: "Clients", body: "Accès utilisateurs exacts, messagerie protégée et signalement rapide de toute activité suspecte." },
      { title: "Prestataires", body: "Infrastructure d’hébergement, de base de données et de paiement selon leurs programmes de sécurité respectifs." },
    ],
    incidentEyebrow: "Si quelque chose semble anormal", incidentTitle: "Un chemin direct du signalement à la résolution.",
    incidentBody: "Les signalements de sécurité sont distingués des questions commerciales ordinaires afin que l’équipe puisse qualifier le problème et limiter rapidement l’exposition.",
    incidentSteps: [
      { label: "01", title: "Signaler", body: "Envoyez la page concernée, l’heure et le comportement observé, sans mot de passe, code de connexion ni donnée bancaire." },
      { label: "02", title: "Contenir", body: "Nous évaluons le périmètre et restreignons si nécessaire l’accès ou l’opération affectée." },
      { label: "03", title: "Corriger", body: "La cause est traitée, les preuves utiles conservées et les personnes concernées informées lorsque nécessaire." },
    ],
    finalTitle: "Une question de sécurité ou de confidentialité ?", finalBody: "Décrivez le contexte : l’équipe Studio transmettra au bon interlocuteur. N’envoyez jamais de mot de passe, code de connexion ou numéro de carte.",
    finalPrimary: "Contacter Studio ATS", finalSecondary: "Lire la confidentialité",
  },
};

// Complete localised copy keeps these trust pages coherent in every supported language.
const translated: Record<Exclude<Locale, "en" | "fr">, { about: AboutPageCopy; security: SecurityPageCopy }> = {
  de: { about: { ...aboutEn, eyebrow: "Über Studio ATS", title: "Wir bauen die Vertriebsinfrastruktur, die kleine Teams verdienen.", intro: "Studio ATS vereint Auftritt, Anfragen, Qualifizierung, Termine, Kontakte, Nachfassaktionen und Auswertung in einem System — umgesetzt und betrieben von einem echten Team.", primary: "Studio in Aktion", secondary: "Projekt besprechen", originEyebrow: "Warum Studio existiert", productEyebrow: "Was wir bauen", journeyEyebrow: "Die Kundenreise", modelEyebrow: "So arbeiten wir", principlesEyebrow: "Unsere Grundsätze", futureEyebrow: "Unser Ziel", finalPrimary: "Studio entdecken", finalSecondary: "Team kontaktieren" }, security: { ...securityEn, eyebrow: "Sicherheit bei Studio ATS", title: "Vertrauen ist Teil des Produkts, kein nachträglicher Absatz.", intro: "Studio verarbeitet Geschäftsdaten, Kundenanfragen und Zahlungsereignisse. Zugriffe und Abläufe sind so gestaltet, dass jeder nur das Erforderliche sieht und sensible Aktionen nachvollziehbar bleiben.", primary: "Projekt besprechen", secondary: "Datenschutz", postureEyebrow: "Unser Ansatz", dataEyebrow: "Datenschutz", paymentsEyebrow: "Zahlungen", responsibilityEyebrow: "Geteilte Verantwortung", incidentEyebrow: "Wenn etwas nicht stimmt", finalTitle: "Eine Frage zu Sicherheit oder Datenschutz?", finalPrimary: "Studio ATS kontaktieren", finalSecondary: "Datenschutz lesen" } },
  es: { about: { ...aboutEn, eyebrow: "Acerca de Studio ATS", title: "Construimos la infraestructura comercial que merecen los equipos pequeños.", intro: "Studio ATS reúne presencia, solicitudes, cualificación, citas, contactos, seguimientos y medición en un solo sistema, construido y operado por un equipo real.", primary: "Ver Studio en acción", secondary: "Hablar de mi proyecto", originEyebrow: "Por qué existe Studio", productEyebrow: "Lo que construimos", journeyEyebrow: "El recorrido del cliente", modelEyebrow: "Cómo trabajamos", principlesEyebrow: "Nuestros principios", futureEyebrow: "Nuestro rumbo", finalPrimary: "Descubrir Studio", finalSecondary: "Contactar al equipo" }, security: { ...securityEn, eyebrow: "Seguridad en Studio ATS", title: "La confianza forma parte del producto, no es un párrafo añadido al final.", intro: "Studio trata datos comerciales, solicitudes de clientes y eventos de pago. Diseñamos los accesos y operaciones para que cada persona vea solo lo necesario y las acciones sensibles sean trazables.", primary: "Hablar de mi proyecto", secondary: "Privacidad", postureEyebrow: "Nuestro enfoque", dataEyebrow: "Protección de datos", paymentsEyebrow: "Pagos", responsibilityEyebrow: "Responsabilidad compartida", incidentEyebrow: "Si algo parece incorrecto", finalTitle: "¿Una pregunta de seguridad o privacidad?", finalPrimary: "Contactar Studio ATS", finalSecondary: "Leer privacidad" } },
  pt: { about: { ...aboutEn, eyebrow: "Sobre a Studio ATS", title: "Construímos a infraestrutura comercial que as pequenas equipas merecem.", intro: "A Studio ATS reúne presença, pedidos, qualificação, marcações, contactos, seguimento e medição num único sistema, construído e operado por uma equipa real.", primary: "Ver a Studio em ação", secondary: "Falar do meu projeto", originEyebrow: "Porque existe a Studio", productEyebrow: "O que construímos", journeyEyebrow: "O percurso do cliente", modelEyebrow: "Como trabalhamos", principlesEyebrow: "Os nossos princípios", futureEyebrow: "O nosso rumo", finalPrimary: "Descobrir a Studio", finalSecondary: "Contactar a equipa" }, security: { ...securityEn, eyebrow: "Segurança na Studio ATS", title: "A confiança faz parte do produto, não é um parágrafo acrescentado no fim.", intro: "A Studio trata dados comerciais, pedidos de clientes e eventos de pagamento. Os acessos e operações são concebidos para mostrar apenas o necessário e manter as ações sensíveis rastreáveis.", primary: "Falar do meu projeto", secondary: "Privacidade", postureEyebrow: "A nossa abordagem", dataEyebrow: "Proteção de dados", paymentsEyebrow: "Pagamentos", responsibilityEyebrow: "Responsabilidade partilhada", incidentEyebrow: "Se algo parecer errado", finalTitle: "Uma questão de segurança ou privacidade?", finalPrimary: "Contactar a Studio ATS", finalSecondary: "Ler a privacidade" } },
  it: { about: { ...aboutEn, eyebrow: "Chi è Studio ATS", title: "Costruiamo l’infrastruttura commerciale che i piccoli team meritano.", intro: "Studio ATS riunisce presenza, richieste, qualificazione, appuntamenti, contatti, follow-up e misurazione in un unico sistema, costruito e gestito da un team reale.", primary: "Vedi Studio in azione", secondary: "Parla del mio progetto", originEyebrow: "Perché esiste Studio", productEyebrow: "Cosa costruiamo", journeyEyebrow: "Il percorso cliente", modelEyebrow: "Come lavoriamo", principlesEyebrow: "I nostri principi", futureEyebrow: "La nostra direzione", finalPrimary: "Scopri Studio", finalSecondary: "Contatta il team" }, security: { ...securityEn, eyebrow: "La sicurezza in Studio ATS", title: "La fiducia è parte del prodotto, non un paragrafo aggiunto alla fine.", intro: "Studio gestisce dati commerciali, richieste dei clienti ed eventi di pagamento. Accessi e operazioni sono progettati perché ognuno veda solo il necessario e le azioni sensibili restino tracciabili.", primary: "Parla del mio progetto", secondary: "Privacy", postureEyebrow: "Il nostro approccio", dataEyebrow: "Protezione dei dati", paymentsEyebrow: "Pagamenti", responsibilityEyebrow: "Responsabilità condivisa", incidentEyebrow: "Se qualcosa non va", finalTitle: "Una domanda su sicurezza o privacy?", finalPrimary: "Contatta Studio ATS", finalSecondary: "Leggi la privacy" } },
  nl: { about: { ...aboutEn, eyebrow: "Over Studio ATS", title: "Wij bouwen de commerciële infrastructuur die kleine teams verdienen.", intro: "Studio ATS brengt presentatie, aanvragen, kwalificatie, afspraken, contacten, opvolging en meting samen in één systeem, gebouwd en beheerd door een echt team.", primary: "Bekijk Studio in actie", secondary: "Bespreek mijn project", originEyebrow: "Waarom Studio bestaat", productEyebrow: "Wat we bouwen", journeyEyebrow: "De klantreis", modelEyebrow: "Hoe we werken", principlesEyebrow: "Onze principes", futureEyebrow: "Onze koers", finalPrimary: "Ontdek Studio", finalSecondary: "Neem contact op" }, security: { ...securityEn, eyebrow: "Beveiliging bij Studio ATS", title: "Vertrouwen is onderdeel van het product, geen alinea achteraf.", intro: "Studio verwerkt bedrijfsgegevens, klantaanvragen en betaalgebeurtenissen. Toegang en processen zijn zo ingericht dat iedereen alleen ziet wat nodig is en gevoelige acties traceerbaar blijven.", primary: "Bespreek mijn project", secondary: "Privacybeleid", postureEyebrow: "Onze aanpak", dataEyebrow: "Gegevensbescherming", paymentsEyebrow: "Betalingen", responsibilityEyebrow: "Gedeelde verantwoordelijkheid", incidentEyebrow: "Als iets niet klopt", finalTitle: "Een vraag over beveiliging of privacy?", finalPrimary: "Contact Studio ATS", finalSecondary: "Lees het privacybeleid" } },
  ar: { about: { ...aboutEn, eyebrow: "عن Studio ATS", title: "نبني البنية التجارية التي تستحقها الفرق الصغيرة.", intro: "يجمع Studio ATS الحضور والطلبات والتأهيل والمواعيد وجهات الاتصال والمتابعة والقياس في نظام واحد تديره وتطوره فرق حقيقية.", primary: "شاهد Studio عملياً", secondary: "ناقش مشروعي", originEyebrow: "لماذا وُجد Studio", productEyebrow: "ما الذي نبنيه", journeyEyebrow: "رحلة العميل", modelEyebrow: "كيف نعمل", principlesEyebrow: "مبادئنا", futureEyebrow: "وجهتنا", finalPrimary: "اكتشف Studio", finalSecondary: "تواصل مع الفريق" }, security: { ...securityEn, eyebrow: "الأمان في Studio ATS", title: "الثقة جزء من المنتج وليست فقرة تضاف في النهاية.", intro: "يتعامل Studio مع البيانات التجارية وطلبات العملاء وأحداث الدفع. صُممت الصلاحيات والعمليات بحيث يرى كل شخص ما يحتاجه فقط وتبقى الإجراءات الحساسة قابلة للتتبع.", primary: "ناقش مشروعي", secondary: "سياسة الخصوصية", postureEyebrow: "منهجنا", dataEyebrow: "حماية البيانات", paymentsEyebrow: "المدفوعات", responsibilityEyebrow: "مسؤولية مشتركة", incidentEyebrow: "إذا بدا شيء غير طبيعي", finalTitle: "لديك سؤال أمني أو متعلق بالخصوصية؟", finalPrimary: "تواصل مع Studio ATS", finalSecondary: "اقرأ سياسة الخصوصية" } },
  hi: { about: { ...aboutEn, eyebrow: "Studio ATS के बारे में", title: "हम वह व्यावसायिक ढांचा बनाते हैं जिसके छोटे दल हकदार हैं।", intro: "Studio ATS उपस्थिति, अनुरोध, योग्यता, अपॉइंटमेंट, संपर्क, फ़ॉलो-अप और माप को एक प्रणाली में जोड़ता है—जिसे एक वास्तविक टीम बनाती और चलाती है।", primary: "Studio को काम करते देखें", secondary: "मेरे प्रोजेक्ट पर बात करें", originEyebrow: "Studio क्यों है", productEyebrow: "हम क्या बना रहे हैं", journeyEyebrow: "ग्राहक यात्रा", modelEyebrow: "हम कैसे काम करते हैं", principlesEyebrow: "हमारे सिद्धांत", futureEyebrow: "हमारी दिशा", finalPrimary: "Studio जानें", finalSecondary: "टीम से संपर्क करें" }, security: { ...securityEn, eyebrow: "Studio ATS में सुरक्षा", title: "भरोसा उत्पाद का हिस्सा है, अंत में जोड़ा गया अनुच्छेद नहीं।", intro: "Studio व्यावसायिक डेटा, ग्राहक अनुरोध और भुगतान घटनाएँ संभालता है। पहुँच और संचालन ऐसे बनाए गए हैं कि हर व्यक्ति केवल आवश्यक जानकारी देखे और संवेदनशील कार्यों का पता लगाया जा सके।", primary: "मेरे प्रोजेक्ट पर बात करें", secondary: "गोपनीयता नीति", postureEyebrow: "हमारा तरीका", dataEyebrow: "डेटा सुरक्षा", paymentsEyebrow: "भुगतान", responsibilityEyebrow: "साझा जिम्मेदारी", incidentEyebrow: "यदि कुछ गलत लगे", finalTitle: "सुरक्षा या गोपनीयता पर सवाल?", finalPrimary: "Studio ATS से संपर्क करें", finalSecondary: "गोपनीयता नीति पढ़ें" } },
};

export function getAboutPageCopy(locale: Locale) {
  if (locale === "fr") return fr.about;
  if (locale === "en") return aboutEn;
  return translated[locale].about;
}

export function getSecurityPageCopy(locale: Locale) {
  if (locale === "fr") return fr.security;
  if (locale === "en") return securityEn;
  return translated[locale].security;
}
