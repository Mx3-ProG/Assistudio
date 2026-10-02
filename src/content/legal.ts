export type LegalDocumentKind = "legal" | "privacy" | "cookies" | "terms" | "affiliateTerms";

export type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "definitions"; items: { term: string; definition: string }[] }
  | { type: "notice"; text: string };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  description: string;
  version: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}

const company = "Wayne-web";
const platform = "Studio ATS";
const contact = "contact@atonservice.org";

const legal: LegalDocument = {
  title: "Mentions légales",
  description: "Informations légales relatives à l’éditeur, au directeur de la publication et à l’hébergement de Studio ATS.",
  version: "1.0",
  updatedAt: "2 octobre 2026",
  intro: `Les présentes mentions identifient l’éditeur et les principaux intervenants du site et de la plateforme ${platform}.`,
  sections: [
    {
      id: "editeur",
      title: "Éditeur",
      blocks: [
        { type: "definitions", items: [
          { term: "Dénomination sociale", definition: company },
          { term: "Forme juridique", definition: "Société par actions simplifiée (SAS)" },
          { term: "Capital social", definition: "50,00 euros" },
          { term: "Siège social", definition: "3 allée du Dr Lejzer Ludwik, 31100 Toulouse, France" },
          { term: "Immatriculation", definition: "RCS Toulouse 108 884 032" },
          { term: "Numéro de gestion", definition: "2026 B 04717" },
          { term: "EUID", definition: "FR3102.108884032" },
          { term: "Nom commercial", definition: "W-W" },
          { term: "Contact", definition: contact },
        ] },
        { type: "paragraph", text: `${platform} est un service édité et exploité par ${company}. Toute correspondance juridique peut être adressée au siège social ou à l’adresse électronique indiquée ci-dessus.` },
      ],
    },
    {
      id: "publication",
      title: "Direction de la publication",
      blocks: [
        { type: "paragraph", text: "Le directeur de la publication est Mathieu Deffontaines, en qualité de Directeur Général de Wayne-web." },
      ],
    },
    {
      id: "hebergement",
      title: "Hébergement",
      blocks: [
        { type: "paragraph", text: "Le service est hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis. Téléphone : +1 559 288 7060. Des services techniques complémentaires, notamment Supabase, peuvent être utilisés pour la base de données, l’authentification et le stockage." },
      ],
    },
    {
      id: "activite",
      title: "Activité",
      blocks: [
        { type: "paragraph", text: `${company} exerce notamment des activités de programmation informatique, de conseil et de développement de sites internet, logiciels et systèmes digitaux, ainsi que d’édition et de commercialisation de logiciels utilisés à des fins professionnelles ou personnelles.` },
        { type: "paragraph", text: `La présentation de produits ou services sur ${platform} ne constitue pas, à elle seule, une offre ferme. Les prestations destinées aux clients font l’objet d’une offre, d’un devis, d’un dossier contractuel ou de conditions particulières.` },
      ],
    },
    {
      id: "propriete-intellectuelle",
      title: "Propriété intellectuelle",
      blocks: [
        { type: "paragraph", text: `La structure du service, les logiciels, bases de données, textes, graphismes, interfaces, marques, logos, signes distinctifs, vidéos, documents et contenus créés par ${company} sont protégés par les droits de propriété intellectuelle applicables. Aucun droit n’est cédé du seul fait de l’accès au service.` },
        { type: "paragraph", text: "Toute reproduction, extraction, adaptation, représentation ou exploitation non autorisée, totale ou partielle, est interdite, sous réserve des exceptions prévues par la loi et des licences expressément accordées aux partenaires dans leurs conditions dédiées." },
      ],
    },
    {
      id: "signalement",
      title: "Signalement d’un contenu ou d’une atteinte",
      blocks: [
        { type: "paragraph", text: `Toute notification concernant un contenu manifestement illicite, une atteinte à un droit de propriété intellectuelle ou un problème de sécurité peut être adressée à ${contact}. Elle doit permettre d’identifier précisément le contenu, sa localisation, les motifs du signalement et les coordonnées du demandeur.` },
      ],
    },
    {
      id: "droit-applicable",
      title: "Droit applicable",
      blocks: [
        { type: "paragraph", text: "Le présent site et ces mentions sont soumis au droit français. Les règles de compétence juridictionnelle sont précisées, selon la qualité de l’utilisateur et le service concerné, dans les conditions générales d’utilisation ou les conditions partenaires." },
      ],
    },
  ],
};

const privacy: LegalDocument = {
  title: "Politique de confidentialité",
  description: "Informations sur les traitements de données personnelles réalisés dans le cadre de Studio ATS.",
  version: "1.0",
  updatedAt: "2 octobre 2026",
  intro: `${company} attache une importance particulière à la protection des données personnelles. La présente politique explique quelles données sont traitées dans le cadre de ${platform}, pourquoi, pendant combien de temps et comment exercer vos droits.`,
  sections: [
    {
      id: "responsable",
      title: "Responsable du traitement et contact",
      blocks: [
        { type: "paragraph", text: `Le responsable des traitements décrits dans la présente politique est ${company}, SAS au capital de 50,00 euros, immatriculée au RCS de Toulouse sous le numéro 108 884 032, dont le siège est situé 3 allée du Dr Lejzer Ludwik, 31100 Toulouse, France.` },
        { type: "paragraph", text: `Les demandes relatives aux données personnelles peuvent être adressées à ${contact} ou par courrier au siège social, avec la mention « Protection des données ». Aucun délégué à la protection des données n’est désigné à la date de mise à jour.` },
      ],
    },
    {
      id: "personnes",
      title: "Personnes concernées",
      blocks: [
        { type: "list", items: [
          "visiteurs du site et des pages commerciales ou de recommandation ;",
          "personnes qui demandent à être contactées, prospects et représentants de clients ;",
          "candidats, membres et anciens membres du programme partenaire ;",
          "utilisateurs des espaces privés, de la messagerie, du support et des dossiers commerciaux ;",
          "clients, payeurs, bénéficiaires de prestations et interlocuteurs professionnels ;",
          "personnes dont les coordonnées sont enregistrées par un partenaire dans son espace de suivi commercial.",
        ] },
      ],
    },
    {
      id: "donnees",
      title: "Catégories de données traitées",
      blocks: [
        { type: "list", items: [
          "identité et coordonnées : nom, prénom, société, fonction, pays, adresse électronique, téléphone et site internet ;",
          "données de compte et de candidature : identifiant, langue, statut du compte, canal commercial, parrain, consentements et dates d’acceptation ;",
          "données commerciales : besoins, messages, notes, étapes d’un prospect, campagnes, liens, rendez-vous, dossiers, devis, acceptations et références client ;",
          "données d’affiliation : code, parrainage, clics, source, campagne, page d’arrivée, paramètres UTM, attribution, ventes, commissions, remboursements et paiements ;",
          "données techniques et de sécurité : journaux, adresse IP et agent utilisateur sous forme hachée lorsque cela est prévu, appareil, pays approximatif, événements de sécurité et signaux de fraude ;",
          "communications : messages, pièces jointes, demandes d’assistance, signalements et suites de modération ;",
          "données financières limitées : références et statuts transmis par Stripe. Les numéros complets de carte et coordonnées bancaires sont recueillis directement par Stripe et ne sont pas stockés par Wayne-web ;",
          "préférences enregistrées sur le terminal : langue, devise, thème, choix de consentement, affichage et brouillons locaux.",
        ] },
        { type: "notice", text: "Ne transmettez pas, dans les champs libres ou la messagerie, de données sensibles ou de documents d’identité qui ne sont pas strictement nécessaires. Les vérifications d’identité et bancaires liées aux paiements doivent être réalisées dans l’interface sécurisée de Stripe." },
      ],
    },
    {
      id: "finalites",
      title: "Finalités et bases juridiques",
      blocks: [
        { type: "definitions", items: [
          { term: "Accès et compte", definition: "Créer et sécuriser le compte, authentifier l’utilisateur, fournir les fonctionnalités demandées et gérer le support. Base : exécution du contrat ou mesures précontractuelles." },
          { term: "Programme partenaire", definition: "Examiner la candidature, gérer l’apport d’affaires, attribuer les ventes, calculer et verser les commissions, administrer le parrainage et traiter les contestations. Base : exécution des conditions partenaires." },
          { term: "Prospection et relation commerciale", definition: "Répondre aux demandes, organiser les rendez-vous, préparer les offres et suivre la relation. Base : mesures précontractuelles, contrat ou intérêt légitime à développer l’activité." },
          { term: "Paiements, comptabilité et conformité", definition: "Traiter les paiements, remboursements, factures, justificatifs, obligations fiscales et lutte contre la fraude. Base : contrat, obligation légale et intérêt légitime à sécuriser les opérations." },
          { term: "Communication", definition: "Envoyer les messages transactionnels, notifications de service et réponses d’assistance. Base : contrat et intérêt légitime au bon fonctionnement du service." },
          { term: "Sécurité et preuve", definition: "Prévenir les abus, protéger les comptes, journaliser les opérations sensibles, établir ou défendre des droits. Base : intérêt légitime et obligations légales." },
          { term: "Mesure facultative", definition: "Mesurer l’audience ou les campagnes au moyen de traceurs non essentiels lorsqu’ils sont activés. Base : consentement, retirable à tout moment." },
        ] },
      ],
    },
    {
      id: "collecte-indirecte",
      title: "Données communiquées par un partenaire",
      blocks: [
        { type: "paragraph", text: `Un partenaire peut enregistrer dans son espace des coordonnées professionnelles obtenues directement auprès d’un prospect ou auprès d’une source licite. Pour sa prospection propre et la saisie initiale de ces informations, le partenaire agit en principe comme responsable de traitement distinct et doit informer la personne concernée. ${company} traite ensuite les données nécessaires pour fournir l’outil, gérer une demande transmise ou exécuter une relation commerciale.` },
        { type: "paragraph", text: "Si vous avez été contacté par un partenaire ou si vous souhaitez connaître l’origine de vos données, vous pouvez écrire à l’adresse indiquée à l’article 1 en précisant les éléments permettant de retrouver la fiche concernée." },
      ],
    },
    {
      id: "obligatoire",
      title: "Caractère obligatoire des informations",
      blocks: [
        { type: "paragraph", text: "Les champs signalés comme obligatoires sont nécessaires pour traiter la demande, créer le compte, conclure ou exécuter le contrat concerné. Leur absence peut empêcher la fourniture du service. Les autres informations sont facultatives, sauf obligation légale ou exigence du prestataire de paiement." },
      ],
    },
    {
      id: "destinataires",
      title: "Destinataires et prestataires",
      blocks: [
        { type: "paragraph", text: `Les données sont accessibles, dans la limite de leurs attributions, aux personnes habilitées de ${company}. Les partenaires ne reçoivent que les informations nécessaires au suivi de leurs propres activités ; ils n’accèdent pas librement aux coordonnées des demandes entrantes ni aux données d’autres partenaires.` },
        { type: "list", items: [
          "Supabase pour la base de données, l’authentification et le stockage ;",
          "Vercel pour l’hébergement et la diffusion de l’application ;",
          "Stripe pour l’encaissement, la prévention de la fraude, la vérification des comptes de paiement et les versements ;",
          "Resend et les services de courrier électronique configurés pour l’envoi des codes et messages transactionnels ;",
          "conseils, auditeurs, autorités, juridictions ou auxiliaires de justice lorsque la loi l’exige ou pour défendre un droit.",
        ] },
        { type: "paragraph", text: "Ces prestataires agissent selon leur rôle propre ou sur instructions de Wayne-web et ne reçoivent que les données nécessaires à leur mission." },
      ],
    },
    {
      id: "transferts",
      title: "Transferts hors de l’Espace économique européen",
      blocks: [
        { type: "paragraph", text: "Certains prestataires sont établis ou peuvent traiter des données aux États-Unis ou dans d’autres pays hors de l’Espace économique européen. Selon le service et le pays concernés, les transferts reposent sur une décision d’adéquation, le cadre de protection des données UE–États-Unis lorsqu’il est applicable, les clauses contractuelles types de la Commission européenne ou une autre garantie autorisée. Une copie des garanties pertinentes peut être demandée à Wayne-web, sous réserve des informations confidentielles." },
      ],
    },
    {
      id: "conservation",
      title: "Durées de conservation",
      blocks: [
        { type: "list", items: [
          "demandes et prospects sans relation contractuelle : jusqu’à trois ans après le dernier contact utile, sauf opposition antérieure ;",
          "compte partenaire et données d’exécution : pendant la relation, puis jusqu’à cinq ans pour la preuve et la défense des droits ;",
          "candidature refusée ou abandonnée : jusqu’à deux ans après la dernière interaction ;",
          "dossiers clients et contrats : pendant la relation, puis cinq ans ; pièces comptables et factures : dix ans lorsque la loi l’impose ;",
          "commissions, registre financier, remboursements et justificatifs : durée nécessaire aux obligations comptables, fiscales et à la défense des droits ;",
          "messages et demandes d’assistance : pendant la vie du compte puis jusqu’à trois ans, sauf conservation plus longue nécessaire à un signalement ou un litige ;",
          "journaux de sécurité et empreintes techniques : en principe douze mois ;",
          "données de clic et d’attribution identifiables : au maximum treize mois, sous réserve d’une durée plus courte configurée pour l’attribution ;",
          "sauvegardes : suppression progressive selon les cycles techniques, en principe dans un délai maximal de quatre-vingt-dix jours après suppression de la donnée active.",
        ] },
        { type: "paragraph", text: "Une donnée peut être conservée plus longtemps lorsqu’une obligation légale, une procédure, une fraude avérée ou la constatation, l’exercice ou la défense d’un droit le justifie. Elle est alors isolée ou son accès est restreint." },
      ],
    },
    {
      id: "droits",
      title: "Vos droits",
      blocks: [
        { type: "paragraph", text: "Selon la base légale et votre situation, vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité, ainsi que du droit de retirer votre consentement sans remettre en cause les traitements antérieurs. Vous pouvez également définir des directives relatives au sort de vos données après votre décès dans les conditions du droit français." },
        { type: "paragraph", text: `Vous pouvez exercer ces droits depuis les réglages disponibles ou en écrivant à ${contact}. Une preuve d’identité peut être demandée uniquement en cas de doute raisonnable. Une réponse est apportée en principe dans un délai d’un mois, susceptible d’être prolongé de deux mois pour une demande complexe ou nombreuse.` },
      ],
    },
    {
      id: "reclamation",
      title: "Réclamation auprès de la CNIL",
      blocks: [
        { type: "paragraph", text: "Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez saisir la Commission nationale de l’informatique et des libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, ou utiliser le service de plainte disponible sur www.cnil.fr." },
      ],
    },
    {
      id: "securite",
      title: "Sécurité",
      blocks: [
        { type: "paragraph", text: `${company} met en œuvre des mesures techniques et organisationnelles proportionnées aux risques : contrôle d’accès, séparation des rôles, politiques de sécurité au niveau des données, chiffrement des échanges, liens temporaires pour les fichiers privés, hachage de certains identifiants techniques, journalisation des opérations sensibles et sauvegardes.` },
        { type: "paragraph", text: "Aucune transmission ou infrastructure ne pouvant être garantie comme absolument sûre, l’utilisateur doit protéger son accès à sa messagerie, ne jamais transmettre ses codes de connexion et signaler rapidement toute suspicion de compromission." },
      ],
    },
    {
      id: "decisions",
      title: "Décisions automatisées",
      blocks: [
        { type: "paragraph", text: "Des signaux automatiques peuvent détecter des clics anormaux, doublons, auto-parrainages, remboursements ou risques de fraude. Ils peuvent placer une commission en revue, mais aucune décision produisant un effet juridique significatif n’est prise exclusivement sur ce fondement : une intervention humaine est prévue avant une suspension définitive, un rejet ou une correction financière contestée." },
      ],
    },
    {
      id: "mise-a-jour",
      title: "Mise à jour de la politique",
      blocks: [
        { type: "paragraph", text: "La politique peut évoluer pour refléter une modification du service, des prestataires ou de la réglementation. En cas de changement substantiel, une information adaptée sera fournie avant l’entrée en vigueur lorsque cela est requis." },
      ],
    },
  ],
};

const cookies: LegalDocument = {
  title: "Politique relative aux cookies et autres traceurs",
  description: "Liste et finalités des cookies et stockages locaux utilisés par Studio ATS.",
  version: "1.0",
  updatedAt: "2 octobre 2026",
  intro: `Cette politique décrit les opérations de lecture ou d’écriture réalisées sur votre terminal lors de l’utilisation de ${platform}, y compris les cookies, le stockage local et le stockage de session.`,
  sections: [
    {
      id: "definition",
      title: "Qu’est-ce qu’un traceur ?",
      blocks: [
        { type: "paragraph", text: "Un traceur est une information déposée ou lue dans le navigateur ou l’appareil utilisé pour accéder à un service. Il peut servir à maintenir une session, mémoriser une préférence, sécuriser un accès, attribuer une recommandation ou mesurer l’utilisation d’une page." },
      ],
    },
    {
      id: "necessaires",
      title: "Traceurs nécessaires",
      blocks: [
        { type: "definitions", items: [
          { term: "NEXT_LOCALE", definition: "Mémorise la langue choisie. Durée maximale : 12 mois." },
          { term: "STUDIO_CURRENCY et studio-currency", definition: "Mémorisent la devise d’affichage. Durée maximale : 12 mois ou jusqu’à suppression du stockage local." },
          { term: "studio-theme", definition: "Mémorise le thème visuel choisi dans le stockage local, jusqu’à suppression par l’utilisateur." },
          { term: "studio-consent", definition: "Conserve le choix relatif aux traceurs pendant 6 mois afin de ne pas solliciter l’utilisateur à chaque visite." },
          { term: "Cookies de session Supabase", definition: "Maintiennent l’authentification et renouvellent de manière sécurisée la session de l’espace privé. Leur durée dépend de la session et de la configuration d’authentification." },
          { term: "studio_dossier_session", definition: "Autorise temporairement l’accès d’un client à son dossier commercial. Durée maximale : 7 jours." },
          { term: "Stockages fonctionnels du tableau de bord", definition: "Mémorisent une vue, une liste de travail, des favoris ou un brouillon saisi sur l’appareil. Ils restent sur le terminal jusqu’à leur suppression ou à l’effacement des données du site." },
        ] },
        { type: "paragraph", text: "Ces traceurs sont utilisés pour fournir une fonctionnalité explicitement demandée, sécuriser le service ou conserver un choix. Leur blocage peut empêcher la connexion, l’accès à un dossier ou la mémorisation des préférences." },
      ],
    },
    {
      id: "attribution",
      title: "Attribution des recommandations",
      blocks: [
        { type: "definitions", items: [
          { term: "studio_ref", definition: "Conserve le premier et le dernier apporteur associé à la visite, ainsi que la campagne et la date, afin d’attribuer une vente selon la règle active. Durée technique maximale : 13 mois ; la fenêtre commerciale appliquée peut être plus courte." },
          { term: "studio_vid", definition: "Identifiant aléatoire de navigateur utilisé pour distinguer les visites et détecter des anomalies sans stocker l’adresse IP en clair. Durée technique maximale : 13 mois." },
          { term: "studio-pv-*", definition: "Clé de stockage de session empêchant le double comptage d’une même page commerciale pendant une session. Elle disparaît à la fin de la session du navigateur." },
        ] },
        { type: "paragraph", text: "Ces mécanismes assurent le fonctionnement du programme de recommandation lorsque l’utilisateur ouvre volontairement un lien ou une page attribuée à un partenaire. Les informations d’attribution ne sont pas vendues et ne sont pas utilisées pour suivre la navigation sur des sites tiers." },
      ],
    },
    {
      id: "facultatifs",
      title: "Mesure d’audience facultative",
      blocks: [
        { type: "paragraph", text: "À la date de mise à jour, aucun traceur publicitaire tiers ni outil facultatif de mesure d’audience intersites n’est activé. Si un tel outil est ajouté, il restera désactivé jusqu’à un consentement valable et la présente liste sera mise à jour avec son fournisseur, sa finalité et sa durée." },
      ],
    },
    {
      id: "choix",
      title: "Gérer votre choix",
      blocks: [
        { type: "paragraph", text: "Le bandeau permet d’accepter les éventuels traceurs facultatifs ou de continuer avec les traceurs nécessaires uniquement. Le refus est sans conséquence sur l’accès aux fonctions publiques essentielles. Vous pouvez retirer votre consentement aussi facilement que vous l’avez donné en supprimant le choix enregistré dans les données du site ; le bandeau sera alors présenté à nouveau." },
        { type: "notice", text: "La suppression de tous les cookies peut vous déconnecter, effacer vos préférences locales et faire perdre l’attribution d’une recommandation avant une demande ou un achat." },
      ],
    },
    {
      id: "navigateur",
      title: "Réglages du navigateur",
      blocks: [
        { type: "paragraph", text: "La plupart des navigateurs permettent d’afficher, supprimer ou bloquer les cookies et stockages d’un site. Les réglages sont généralement accessibles dans les rubriques Confidentialité, Sécurité ou Données de sites. Le blocage global des traceurs nécessaires peut dégrader le fonctionnement du service." },
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        { type: "paragraph", text: `Pour toute question concernant les traceurs ou les données associées, contactez ${contact}. Pour les autres traitements, consultez la politique de confidentialité.` },
      ],
    },
  ],
};

const terms: LegalDocument = {
  title: "Conditions générales d’utilisation",
  description: "Règles applicables à l’accès et à l’utilisation du site et de la plateforme Studio ATS.",
  version: "1.0",
  updatedAt: "2 octobre 2026",
  intro: `Les présentes conditions générales d’utilisation encadrent l’accès au site, aux contenus publics et aux espaces privés de ${platform}. Elles ne remplacent ni les conditions partenaires ni le contrat ou devis applicable à une prestation achetée.`,
  sections: [
    {
      id: "objet",
      title: "Objet et champ d’application",
      blocks: [
        { type: "paragraph", text: `Les présentes conditions s’appliquent à toute personne qui consulte ou utilise ${platform}. L’éditeur est ${company}, identifié dans les mentions légales. L’accès à certaines fonctions suppose la création d’un compte et l’acceptation de conditions complémentaires.` },
        { type: "paragraph", text: "En accédant au service, l’utilisateur reconnaît avoir pris connaissance des présentes conditions. S’il agit pour le compte d’une organisation, il déclare disposer du pouvoir nécessaire pour l’engager dans la limite de l’utilisation concernée." },
      ],
    },
    {
      id: "definitions",
      title: "Définitions",
      blocks: [
        { type: "definitions", items: [
          { term: "Service", definition: `Le site, la plateforme, les espaces privés, pages commerciales, outils, contenus et fonctions exploités sous le nom ${platform}.` },
          { term: "Utilisateur", definition: "Toute personne qui consulte le Service, avec ou sans compte." },
          { term: "Compte", definition: "Accès personnel authentifié permettant d’utiliser les fonctions réservées." },
          { term: "Contenu utilisateur", definition: "Toute information, donnée, fichier, message ou élément transmis au Service par un utilisateur." },
        ] },
      ],
    },
    {
      id: "acces",
      title: "Accès au Service",
      blocks: [
        { type: "paragraph", text: "Les pages publiques sont en principe accessibles sans compte. Les espaces partenaire, administrateur, messagerie, support et dossiers sont soumis à authentification ou à un lien d’accès spécifique. Les coûts de connexion, d’équipement et de télécommunication restent à la charge de l’utilisateur." },
        { type: "paragraph", text: `${company} peut interrompre temporairement tout ou partie du Service pour maintenance, mise à jour, sécurité, incident technique ou événement indépendant de sa volonté. Aucune disponibilité permanente ni absence totale d’erreur n’est garantie.` },
      ],
    },
    {
      id: "compte",
      title: "Compte, authentification et sécurité",
      blocks: [
        { type: "list", items: [
          "fournir des informations exactes, actuelles et complètes ;",
          "maintenir un accès sécurisé à l’adresse électronique utilisée pour recevoir les codes de connexion ;",
          "ne pas partager un code à usage unique, un lien privé ou une session ;",
          "informer sans délai Wayne-web de toute utilisation non autorisée ou compromission ;",
          "ne pas créer de comptes multiples pour contourner une limitation, une suspension ou une règle d’attribution.",
        ] },
        { type: "paragraph", text: "Toute action réalisée depuis une session régulièrement authentifiée est présumée effectuée par le titulaire, sauf preuve contraire. Cette présomption n’empêche pas l’utilisateur de signaler une fraude ou une compromission." },
      ],
    },
    {
      id: "usage",
      title: "Usages autorisés et interdits",
      blocks: [
        { type: "paragraph", text: "Le Service doit être utilisé de bonne foi, conformément à sa destination, aux lois applicables et aux droits des tiers." },
        { type: "list", items: [
          "ne pas introduire de code malveillant, perturber, saturer, sonder ou contourner la sécurité du Service ;",
          "ne pas accéder à des données ou fonctions sans autorisation, ni tenter d’élever ses privilèges ;",
          "ne pas copier, extraire massivement, indexer ou réutiliser les bases de données et contenus en dehors des fonctions prévues ;",
          "ne pas publier de contenu illicite, trompeur, diffamatoire, discriminatoire, violent, portant atteinte à la vie privée ou aux droits de propriété intellectuelle ;",
          "ne pas usurper une identité, falsifier une preuve, un événement financier ou une attribution ;",
          "ne pas utiliser le Service pour envoyer des sollicitations illicites ou non demandées.",
        ] },
      ],
    },
    {
      id: "contenus",
      title: "Contenus transmis par l’utilisateur",
      blocks: [
        { type: "paragraph", text: "L’utilisateur reste responsable de ses contenus et garantit qu’il dispose des droits et bases juridiques nécessaires pour les transmettre et les utiliser. Il accorde à Wayne-web une licence non exclusive, mondiale et limitée à la durée nécessaire pour héberger, reproduire, adapter techniquement et transmettre ces contenus aux seules fins de fourniture, de sécurisation et d’amélioration du Service." },
        { type: "paragraph", text: `${company} peut retirer ou rendre inaccessible un contenu manifestement illicite, dangereux, contraire aux présentes conditions ou susceptible d’engager sa responsabilité, sans que cette intervention crée une obligation générale de surveillance.` },
      ],
    },
    {
      id: "messagerie",
      title: "Messagerie, support et modération",
      blocks: [
        { type: "paragraph", text: "Les échanges privés ne sont accessibles qu’aux participants autorisés. L’équipe peut accéder à une conversation privée uniquement lorsqu’un message est signalé ou lorsqu’une obligation légale ou une menace de sécurité le justifie ; cet accès peut être journalisé. Les fils de support sont accessibles aux personnes habilitées chargées de répondre." },
        { type: "paragraph", text: "Il est interdit d’utiliser la messagerie pour harceler, menacer, diffuser des logiciels malveillants, collecter illicitement des données, partager des secrets d’authentification ou contourner les règles du programme partenaire." },
      ],
    },
    {
      id: "services-tiers",
      title: "Services et liens de tiers",
      blocks: [
        { type: "paragraph", text: "Le Service s’appuie notamment sur des prestataires d’hébergement, de base de données, d’authentification, d’envoi d’e-mails et de paiement. Leurs propres conditions peuvent s’appliquer à leurs interfaces. Wayne-web n’est pas responsable du contenu, de la disponibilité ou des pratiques d’un site tiers auquel un lien renvoie, sous réserve de ses obligations légales." },
      ],
    },
    {
      id: "propriete",
      title: "Propriété intellectuelle",
      blocks: [
        { type: "paragraph", text: `${company} et ses concédants conservent l’ensemble des droits sur le Service et ses contenus. L’utilisateur reçoit un droit personnel, limité, non exclusif, non cessible et révocable d’utiliser les fonctions mises à sa disposition pendant la durée de son accès.` },
        { type: "paragraph", text: "Aucune rétro-ingénierie, reproduction, adaptation, revente, mise à disposition, extraction ou création d’un service dérivé n’est autorisée, sauf permission écrite ou droit impératif contraire." },
      ],
    },
    {
      id: "informations",
      title: "Informations commerciales et absence de garantie de résultat",
      blocks: [
        { type: "paragraph", text: "Les exemples, projections, statistiques, démonstrations, interfaces fictives et estimations de revenus sont fournis à titre illustratif. Ils ne constituent ni une garantie de vente, de chiffre d’affaires, de classement, de conversion ou de revenu, ni un conseil juridique, fiscal, comptable ou financier." },
        { type: "paragraph", text: "Les prix, fonctions et disponibilités affichés peuvent évoluer jusqu’à la formation d’un contrat. Seuls le devis, le dossier contractuel, la commande confirmée et les conditions particulières applicables déterminent l’engagement relatif à une prestation payante." },
      ],
    },
    {
      id: "responsabilite",
      title: "Responsabilité",
      blocks: [
        { type: "paragraph", text: `${company} répond des dommages directs et prévisibles résultant d’un manquement qui lui est imputable, dans les limites permises par la loi. Elle ne répond pas des pertes liées au réseau, à l’équipement de l’utilisateur, à un prestataire tiers, à un contenu utilisateur, à un usage non conforme ou à un événement de force majeure.` },
        { type: "paragraph", text: "Pour les utilisateurs professionnels, sauf faute lourde, dol, atteinte corporelle ou règle impérative contraire, les dommages indirects — notamment perte d’opportunité, de clientèle, de marge, de données non sauvegardées ou d’image — sont exclus. La responsabilité cumulée liée à l’utilisation gratuite du Service est plafonnée à 500 euros ; lorsque le dommage relève d’un contrat payant, le plafond prévu par ce contrat s’applique." },
      ],
    },
    {
      id: "suspension",
      title: "Suspension et fermeture",
      blocks: [
        { type: "paragraph", text: `${company} peut limiter ou suspendre un accès en cas de risque de sécurité, fraude présumée, violation des présentes conditions, obligation légale, non-paiement ou nécessité de protéger un tiers. Lorsque la situation le permet, l’utilisateur est informé du motif et peut présenter ses observations.` },
        { type: "paragraph", text: "La fermeture d’un compte n’efface pas les obligations nées antérieurement ni les données qui doivent être conservées. Les modalités particulières applicables aux partenaires sont précisées dans les conditions partenaires." },
      ],
    },
    {
      id: "donnees",
      title: "Données personnelles et traceurs",
      blocks: [
        { type: "paragraph", text: "Les traitements de données personnelles sont décrits dans la politique de confidentialité. Les cookies et autres stockages sur le terminal sont décrits dans la politique relative aux cookies. Ces documents font partie de l’information fournie à l’utilisateur mais le consentement aux traceurs facultatifs est recueilli séparément." },
      ],
    },
    {
      id: "preuve",
      title: "Preuve et communications électroniques",
      blocks: [
        { type: "paragraph", text: "Les enregistrements informatiques, horodatages, journaux, confirmations électroniques, e-mails, historiques de version, traces d’acceptation et données financières conservés dans des conditions raisonnables de sécurité sont recevables entre les parties comme éléments de preuve, sans priver quiconque de la faculté d’en contester l’exactitude." },
      ],
    },
    {
      id: "modification",
      title: "Modification des conditions",
      blocks: [
        { type: "paragraph", text: "Les conditions peuvent être modifiées pour tenir compte d’une évolution légale, technique ou fonctionnelle. La version et la date figurent en tête du document. Pour une modification substantielle affectant un compte, une information raisonnable est fournie avant son entrée en vigueur, sauf urgence légale ou de sécurité." },
      ],
    },
    {
      id: "divers",
      title: "Dispositions générales",
      blocks: [
        { type: "paragraph", text: "Le fait de ne pas exercer immédiatement un droit ne vaut pas renonciation. Si une stipulation est déclarée invalide, les autres restent applicables. Les titres facilitent la lecture et n’affectent pas l’interprétation. L’utilisateur ne peut céder ses droits ou obligations sans accord écrit ; Wayne-web peut transférer les présentes conditions dans le cadre d’une restructuration ou d’une cession d’activité, sous réserve d’en informer les utilisateurs lorsque la loi l’exige." },
      ],
    },
    {
      id: "droit",
      title: "Droit applicable et litiges",
      blocks: [
        { type: "paragraph", text: "Les présentes conditions sont régies par le droit français. Les parties recherchent d’abord une solution amiable et peuvent écrire au contact indiqué dans les mentions légales. À défaut, le litige relève des juridictions compétentes selon les règles impératives applicables." },
        { type: "notice", text: "ENTRE COMMERÇANTS, TOUT LITIGE RELATIF À LA VALIDITÉ, L’INTERPRÉTATION OU L’EXÉCUTION DES PRÉSENTES RELÈVERA DE LA COMPÉTENCE EXCLUSIVE DES TRIBUNAUX DU RESSORT DE TOULOUSE, Y COMPRIS EN CAS DE PLURALITÉ DE DÉFENDEURS OU D’APPEL EN GARANTIE." },
      ],
    },
  ],
};

const affiliateTerms: LegalDocument = {
  title: "Conditions du programme partenaire",
  description: "Conditions contractuelles applicables aux apporteurs d’affaires et affiliés de Studio ATS.",
  version: "1.0",
  updatedAt: "2 octobre 2026",
  intro: `Les présentes conditions organisent la relation entre ${company}, exploitant ${platform}, et tout partenaire qui recommande les produits ou services proposés par ${company}. Elles ont pour objet de définir un apport d’affaires indépendant, sans mandat de négocier ou de conclure au nom de ${company}.`,
  sections: [
    {
      id: "parties",
      title: "Parties et acceptation",
      blocks: [
        { type: "paragraph", text: `Le contrat est conclu entre ${company}, SAS au capital de 50,00 euros, RCS Toulouse 108 884 032, siège social 3 allée du Dr Lejzer Ludwik, 31100 Toulouse, et la personne physique ou morale qui demande ou utilise un compte partenaire (le « Partenaire »).` },
        { type: "paragraph", text: "La validation de la case d’acceptation, la vérification du code de connexion et l’utilisation du compte matérialisent l’acceptation des présentes conditions dans leur version affichée. Le Partenaire peut en conserver une copie. Toute condition particulière acceptée par écrit prévaut en cas de contradiction." },
      ],
    },
    {
      id: "definitions",
      title: "Définitions",
      blocks: [
        { type: "definitions", items: [
          { term: "Apport", definition: "Mise en relation ou recommandation identifiable d’un prospect susceptible de conclure directement avec Wayne-web." },
          { term: "Client", definition: "Personne dont le paiement d’une offre éligible a été confirmé et rattaché au Partenaire." },
          { term: "Lien partenaire", definition: "Lien, code, page ou dossier individuel fourni ou validé par Studio ATS pour identifier l’origine d’un apport." },
          { term: "Commission", definition: "Rémunération conditionnelle calculée sur un paiement éligible, conformément à la règle applicable à la date de ce paiement." },
          { term: "Paiement éligible", definition: "Somme effectivement encaissée, non frauduleuse, rattachée au Partenaire et répondant aux critères de l’offre et de la règle de commission." },
          { term: "Tableau de bord", definition: "Espace privé présentant les outils, apports, statuts, ventes, commissions et paiements du Partenaire." },
        ] },
      ],
    },
    {
      id: "objet",
      title: "Objet de la mission",
      blocks: [
        { type: "paragraph", text: `Le Partenaire identifie des prospects et leur présente loyalement ${platform} à l’aide des informations et outils autorisés. Il facilite la mise en relation. ${company} demeure seule responsable de l’étude du besoin, de l’offre finale, du devis, de la contractualisation, de l’encaissement, de la réalisation et du support.` },
        { type: "paragraph", text: "Le Partenaire n’est tenu à aucun volume minimal et Wayne-web ne garantit aucun territoire, prospect, exclusivité, niveau d’activité ou revenu. Wayne-web reste libre d’accepter ou de refuser un prospect, de ne pas émettre d’offre et de contracter directement ou par d’autres canaux." },
      ],
    },
    {
      id: "statut",
      title: "Statut indépendant et absence de mandat",
      blocks: [
        { type: "paragraph", text: "Le Partenaire agit en professionnel indépendant, organise librement son activité, ses horaires, ses moyens et ses démarches, et supporte ses frais. Le contrat ne crée aucun lien de subordination, contrat de travail, société commune, franchise, mandat général, représentation, association ou exclusivité." },
        { type: "list", items: [
          `le Partenaire ne peut ni négocier les conditions essentielles, ni conclure un contrat, ni engager ${company} ;`,
          "il ne peut accepter un paiement, consentir une remise, faire une promesse, fournir une garantie ou signer un document au nom de Wayne-web ;",
          "il ne peut se présenter comme salarié, agent, représentant légal, revendeur agréé ou service client de Wayne-web ;",
          "il doit transmettre à Wayne-web toute demande de négociation, engagement, personnalisation contractuelle ou question juridique ou technique dépassant les éléments officiels fournis.",
        ] },
        { type: "notice", text: "Le Partenaire qui exercerait en pratique, de façon permanente, un pouvoir de négocier ou de conclure au nom de Wayne-web doit interrompre cette pratique et en informer immédiatement Wayne-web afin que la relation soit réexaminée." },
      ],
    },
    {
      id: "eligibilite",
      title: "Éligibilité et obligations administratives",
      blocks: [
        { type: "list", items: [
          "être majeur, juridiquement capable et autorisé à exercer l’activité déclarée ;",
          "disposer, avant tout versement, d’un statut professionnel, fiscal et social permettant de percevoir et déclarer les commissions ;",
          "fournir des informations exactes et les justificatifs raisonnablement nécessaires à l’identification, la conformité, la facturation ou au paiement ;",
          "émettre, lorsque cela est requis, une facture conforme et accomplir seul ses obligations fiscales, sociales, comptables et déclaratives ;",
          "ne pas être soumis à une interdiction professionnelle, sanction ou conflit d’intérêts incompatible avec le programme.",
        ] },
        { type: "paragraph", text: "L’ouverture technique d’un compte ne vaut ni validation définitive du statut ni renonciation aux contrôles. Wayne-web peut demander une régularisation avant de rendre une commission payable." },
      ],
    },
    {
      id: "prospection",
      title: "Prospection loyale et conformité",
      blocks: [
        { type: "paragraph", text: "Le Partenaire prospecte sous sa responsabilité, dans le respect des règles applicables à la publicité, au démarchage, aux communications électroniques, aux listes d’opposition, aux horaires de sollicitation, aux pratiques commerciales et à la protection des données." },
        { type: "list", items: [
          "cibler des destinataires pour lesquels la sollicitation est licite et pertinente ;",
          "s’identifier clairement et indiquer le caractère commercial de la démarche lorsque la loi l’exige ;",
          "respecter immédiatement toute opposition ou demande de ne plus être contacté ;",
          "conserver, lorsque nécessaire, la preuve de la source des coordonnées et de la licéité de la démarche ;",
          "ne pas acheter, extraire automatiquement ou utiliser une base de contacts dont l’origine ou les droits d’usage ne sont pas établis ;",
          "ne pas envoyer de communications massives non sollicitées, automatisées ou trompeuses.",
        ] },
      ],
    },
    {
      id: "discours",
      title: "Présentation du produit et devoir de loyauté",
      blocks: [
        { type: "paragraph", text: `Le Partenaire utilise les informations officielles, à jour et vérifiables fournies dans ${platform}. Il distingue clairement les fonctionnalités disponibles, les exemples, les projets futurs et les prestations soumises à devis.` },
        { type: "list", items: [
          "ne pas garantir un résultat commercial, un chiffre d’affaires, un nombre de rendez-vous, un délai ou une rentabilité ;",
          "ne pas inventer une fonctionnalité, un prix, une promotion, un témoignage, une certification ou une référence client ;",
          "ne pas masquer une limitation substantielle ni dénigrer un concurrent ;",
          "ne pas fournir de conseil juridique, fiscal, financier ou technique au nom de Wayne-web ;",
          "ne pas publier de comparaison trompeuse ni utiliser de faux avis, fausses identités ou faux prospects.",
        ] },
      ],
    },
    {
      id: "marque",
      title: "Marque, contenus et outils commerciaux",
      blocks: [
        { type: "paragraph", text: `Pendant la durée du contrat, ${company} accorde au Partenaire une licence personnelle, non exclusive, non cessible, révocable et limitée à la promotion autorisée de ${platform}, sur les marques, visuels, scripts, études de cas et documents disponibles dans son espace.` },
        { type: "list", items: [
          "respecter les chartes, mentions, versions et consignes de retrait ;",
          "ne pas modifier le sens d’un support ni supprimer une réserve ou une mention légale ;",
          "ne pas déposer ou réserver une marque, un nom de domaine, un compte social, une publicité par mot-clé ou un identifiant imitant Wayne-web ou Studio ATS ;",
          "ne pas créer un site, une page ou une publicité laissant croire qu’il s’agit d’un canal officiel ;",
          "cesser tout usage et supprimer les copies publiques à la fin du contrat ou sur demande motivée.",
        ] },
        { type: "paragraph", text: "Les contenus propres du Partenaire restent sa propriété. Lorsqu’il les transmet à Wayne-web pour une page ou une campagne, il garantit les droits nécessaires et accorde une licence limitée à leur intégration et à leur diffusion pour le programme." },
      ],
    },
    {
      id: "attribution",
      title: "Règles d’attribution",
      blocks: [
        { type: "paragraph", text: "Une commission suppose une attribution valide. Celle-ci peut résulter d’un lien, d’un code, d’une page partenaire, d’un dossier commercial ou d’une affectation manuelle documentée. Le modèle actif peut être le premier clic, le dernier clic ou une attribution manuelle ; la fenêtre applicable est affichée ou configurée dans le Service." },
        { type: "list", items: [
          "l’identifiant doit être actif au moment pertinent et ne pas avoir été altéré ou obtenu par fraude ;",
          "une attribution expire à la fin de la fenêtre définie si aucune conversion éligible n’est intervenue ;",
          "un dossier commercial explicitement rattaché ou une correction administrative justifiée peut prévaloir sur le cookie ;",
          "un prospect déjà engagé avec Wayne-web, déjà rattaché à un autre partenaire ou provenant d’un canal exclu peut ne pas être réattribué ;",
          "les doublons, conflits et erreurs manifestes sont examinés au regard des journaux, dates, échanges et preuves disponibles.",
        ] },
        { type: "paragraph", text: "Le tableau de bord constitue une information opérationnelle. En cas d’écart, les événements de paiement confirmés, le registre de commissions et les décisions de correction auditées font foi jusqu’à preuve d’une erreur." },
      ],
    },
    {
      id: "interdictions",
      title: "Fraudes et pratiques interdites",
      blocks: [
        { type: "list", items: [
          "auto-parrainage, achat pour soi-même ou pour une entité contrôlée afin d’obtenir artificiellement une commission, sauf accord écrit ;",
          "cookie stuffing, redirection invisible, clic forcé, usurpation de code, injection de paramètre ou toute attribution sans action consciente du visiteur ;",
          "création de faux clics, faux prospects, fausses sociétés, fausses ventes ou comptes multiples ;",
          "incitation à annuler puis recommander une commande afin de déplacer l’attribution ;",
          "partage de commission ou remise financée par le Partenaire qui contourne le prix ou les règles affichées, sans accord écrit ;",
          "recours à un sous-affilié, réseau, influenceur rémunéré ou intermédiaire non déclaré lorsque Wayne-web n’a pas donné son accord ;",
          "manipulation d’un remboursement, d’une contestation bancaire, d’un avis ou d’une preuve ;",
          "utilisation du programme pour blanchir des fonds, contourner une sanction ou réaliser une opération illicite.",
        ] },
      ],
    },
    {
      id: "commission",
      title: "Calcul des commissions",
      blocks: [
        { type: "paragraph", text: "La règle standard actuellement présentée peut prévoir 25 % pour le Partenaire direct et 5 % pour son parrain direct. Ces taux ne constituent pas un droit perpétuel : la règle applicable est celle affichée dans le tableau de bord, l’offre ou l’accord particulier à la date de chaque paiement éligible." },
        { type: "paragraph", text: "Sauf règle expresse contraire, la commission est calculée sur le montant effectivement encaissé hors taxes, après remises. La TVA, les sommes non payées, annulées, remboursées ou frauduleuses, les avoirs et les éléments non commissionnables sont exclus. L’arrondi monétaire est effectué au centime." },
        { type: "paragraph", text: "Une règle spécifique liée à un Partenaire, une offre, un produit, une période, un nombre de paiements ou une durée prévaut sur la règle générale. Les évolutions de taux s’appliquent aux paiements futurs et non aux commissions déjà devenues disponibles, sauf correction d’une erreur ou fraude." },
      ],
    },
    {
      id: "naissance",
      title: "Naissance et disponibilité de la commission",
      blocks: [
        { type: "paragraph", text: "Aucune commission n’est due pour un devis, une promesse, un panier, un paiement initié ou une vente non encaissée. Après confirmation du paiement par le prestataire, une commission admissible est inscrite en attente pendant la période de validation affichée dans le Service, actuellement paramétrable et généralement fixée à trente jours." },
        { type: "paragraph", text: "Une commission en attente est conditionnelle et non acquise. Elle devient disponible après la période de validation si le paiement reste éligible et si aucun contrôle justifié n’est en cours. Une alerte de fraude, une contestation, une incohérence de statut ou une demande d’information peut la placer en revue jusqu’à décision humaine." },
      ],
    },
    {
      id: "renouvellements",
      title: "Renouvellements et paiements successifs",
      blocks: [
        { type: "paragraph", text: "Une commission de renouvellement n’existe que si l’offre et la règle applicables la prévoient, si le client renouvelle effectivement, si le paiement est encaissé et si les critères d’éligibilité demeurent remplis. Les projections affichées ne sont pas des créances ni des garanties de revenu futur." },
        { type: "paragraph", text: "Une règle peut limiter les commissions à une durée, à un nombre de paiements ou à la période pendant laquelle le compte est actif. Une résiliation, une suspension justifiée, un impayé, une résiliation client, une migration d’offre ou une exclusion prévue par la règle peut mettre fin aux commissions futures." },
      ],
    },
    {
      id: "remboursements",
      title: "Remboursements, rétrofacturations et corrections",
      blocks: [
        { type: "paragraph", text: "Tout remboursement, avoir, annulation, fraude, impayé définitif ou rétrofacturation entraîne l’annulation totale ou proportionnelle de la commission correspondante selon la règle active. Si la commission a déjà été versée, le montant devient une créance de Wayne-web et peut être déduit des commissions futures." },
        { type: "paragraph", text: "En l’absence de commissions futures suffisantes, Wayne-web peut demander le remboursement du solde, en fournissant le détail de l’opération. Une correction administrative est accompagnée d’un motif et enregistrée dans le registre financier." },
      ],
    },
    {
      id: "paiement",
      title: "Versement des commissions",
      blocks: [
        { type: "paragraph", text: "Les commissions disponibles sont regroupées selon le calendrier et le seuil minimal affichés dans le tableau de bord, sous réserve de la remise des informations et justificatifs requis. La cadence de référence est mensuelle et le seuil peut être configuré ; l’affichage du compte prévaut pour la période concernée." },
        { type: "list", items: [
          "le Partenaire doit disposer d’un compte de paiement valide et achever les vérifications demandées par Stripe ou tout prestataire autorisé ;",
          "les coordonnées bancaires complètes sont fournies au prestataire de paiement, non à Wayne-web ;",
          "les frais ou conversions appliqués par la banque du Partenaire ou le prestataire selon ses propres conditions restent à la charge du Partenaire, sauf indication contraire ;",
          "un paiement peut être différé en cas de contrôle réglementaire, identité incomplète, facture requise manquante, solde inférieur au seuil, contestation ou coordonnées invalides ;",
          "le Partenaire doit signaler une anomalie de relevé dans les trente jours suivant sa mise à disposition.",
        ] },
      ],
    },
    {
      id: "parrainage",
      title: "Parrainage de partenaires",
      blocks: [
        { type: "paragraph", text: "Lorsque le programme de parrainage est actif, un parrain direct peut recevoir une commission distincte sur les paiements éligibles générés par son filleul direct. Le taux, la durée et les exclusions sont ceux de la règle active. Aucun revenu n’est dû pour le simple recrutement d’un partenaire, sans vente client éligible." },
        { type: "paragraph", text: "Le parrain n’exerce aucun pouvoir hiérarchique sur son filleul, ne peut accéder à ses données privées au-delà des fonctions prévues et ne peut lui imposer une méthode, un prix, une dépense ou une contrepartie." },
      ],
    },
    {
      id: "donnees",
      title: "Données personnelles et prospects",
      blocks: [
        { type: "paragraph", text: "Le Partenaire est responsable des données qu’il collecte pour sa propre prospection et des instructions qu’il donne. Il doit disposer d’une base légale, limiter la collecte, informer les personnes, respecter leurs droits, sécuriser ses fichiers et supprimer les données devenues inutiles." },
        { type: "paragraph", text: "Lorsqu’il transmet un prospect à Wayne-web, il garantit que la transmission est licite et que la personne a reçu l’information nécessaire. Chaque partie agit comme responsable distinct pour ses finalités propres, sauf accord écrit de sous-traitance. Le Partenaire ne doit jamais importer une donnée sensible non nécessaire." },
        { type: "paragraph", text: "Le Partenaire s’interdit de réutiliser, vendre ou communiquer les données accessibles via le Service pour une finalité étrangère à l’apport concerné. Il signale sans délai toute perte, divulgation ou accès non autorisé." },
      ],
    },
    {
      id: "confidentialite",
      title: "Confidentialité",
      blocks: [
        { type: "paragraph", text: "Chaque partie protège les informations non publiques reçues de l’autre, notamment les prix non publiés, documents commerciaux, méthodes, données clients, accès, statistiques, vulnérabilités et projets. Elles ne sont utilisées que pour exécuter le contrat et ne sont communiquées qu’aux personnes qui doivent en connaître et sont tenues à une obligation appropriée." },
        { type: "paragraph", text: "L’obligation ne couvre pas une information devenue publique sans faute, déjà connue licitement, obtenue légalement d’un tiers ou développée indépendamment. Une divulgation imposée par la loi est limitée au strict nécessaire et, si possible, précédée d’une information de l’autre partie." },
      ],
    },
    {
      id: "controle",
      title: "Contrôle et coopération",
      blocks: [
        { type: "paragraph", text: "En présence d’un signal raisonnable de fraude, de démarchage illicite, de contenu trompeur, de conflit d’attribution ou d’atteinte à la marque, Wayne-web peut demander les éléments strictement nécessaires à la vérification. Le Partenaire coopère de bonne foi et dispose de la possibilité de présenter ses observations." },
        { type: "paragraph", text: "Le refus persistant de coopérer, la destruction de preuves ou la fourniture d’éléments falsifiés peut justifier une suspension et, selon la gravité, une résiliation immédiate." },
      ],
    },
    {
      id: "suspension",
      title: "Suspension",
      blocks: [
        { type: "paragraph", text: "Wayne-web peut suspendre temporairement le compte, les liens ou les versements en cas de risque de sécurité, soupçon documenté de fraude, non-respect apparent, demande d’une autorité, contestation financière, informations administratives incomplètes ou nécessité de protéger un client." },
        { type: "paragraph", text: "La suspension n’emporte pas automatiquement confiscation. Les commissions concernées sont placées en revue pendant l’instruction. Les fonctions sans lien avec le risque peuvent être maintenues lorsque cela est raisonnablement possible." },
      ],
    },
    {
      id: "duree",
      title: "Durée et résiliation",
      blocks: [
        { type: "paragraph", text: "Le contrat est conclu pour une durée indéterminée à compter de l’acceptation. Chaque partie peut y mettre fin sans motif par notification écrite avec un préavis de trente jours. Le Partenaire peut cesser immédiatement d’utiliser le Service, sous réserve des obligations qui survivent." },
        { type: "paragraph", text: "En cas de manquement remédiable, la partie lésée peut demander sa correction dans un délai raisonnable, en principe quinze jours. La résiliation peut être immédiate en cas de fraude, atteinte grave à la marque, prospection manifestement illicite, violation de confidentialité, défaut de statut légal, risque pour un client, contournement de sécurité ou manquement non réparé." },
        { type: "paragraph", text: "Les commissions déjà disponibles à la date d’effet restent payables, sous réserve des compensations et justificatifs. Les commissions en attente poursuivent leur validation si la vente demeure éligible. Aucun paiement client encaissé après la date d’effet n’ouvre droit à une commission future, sauf accord écrit ou règle plus favorable affichée." },
      ],
    },
    {
      id: "consequences",
      title: "Conséquences de la fin du contrat",
      blocks: [
        { type: "list", items: [
          "cessation de l’accès aux outils réservés et de l’usage des marques ;",
          "désactivation possible des liens, codes, pages et supports personnalisés ;",
          "restitution ou suppression des informations confidentielles qui ne doivent pas être conservées ;",
          "maintien des obligations relatives aux données, à la confidentialité, à la propriété intellectuelle, aux corrections financières et aux litiges ;",
          "conservation des pièces nécessaires aux obligations légales, à la comptabilité et à la preuve des opérations.",
        ] },
      ],
    },
    {
      id: "responsabilite",
      title: "Responsabilité et garantie",
      blocks: [
        { type: "paragraph", text: "Chaque partie répond de ses fautes, déclarations, contenus et obligations. Le Partenaire garantit Wayne-web contre les conséquences directes d’une réclamation de tiers résultant d’une prospection illicite, d’une promesse non autorisée, d’un contenu fourni sans droit, d’une violation de données imputable au Partenaire ou d’un engagement pris sans pouvoir, sous réserve que Wayne-web l’informe et lui permette de participer utilement à la défense." },
        { type: "paragraph", text: "Sauf dol, faute lourde, atteinte corporelle, violation de confidentialité ou disposition impérative, aucune partie ne répond des dommages indirects. La responsabilité cumulée de Wayne-web au titre du programme est limitée au montant total des commissions versées au Partenaire au cours des douze mois précédant le fait générateur, ou à 500 euros si aucun versement n’est intervenu." },
      ],
    },
    {
      id: "force-majeure",
      title: "Force majeure",
      blocks: [
        { type: "paragraph", text: "Aucune partie n’est responsable d’un retard ou d’une inexécution causé par un événement échappant raisonnablement à son contrôle et répondant aux conditions légales de la force majeure. La partie affectée informe l’autre et limite les effets de l’événement. Si l’empêchement se prolonge au-delà de soixante jours, chacune peut résilier les obligations affectées sans indemnité." },
      ],
    },
    {
      id: "modifications",
      title: "Évolution du programme et des conditions",
      blocks: [
        { type: "paragraph", text: "Wayne-web peut faire évoluer les offres, outils, règles d’attribution, seuils, calendriers et conditions pour l’avenir. Une modification substantielle défavorable est notifiée sur un support durable ou dans le compte avec un préavis raisonnable, en principe quinze jours, sauf urgence légale, sécurité, fraude ou exigence d’un prestataire." },
        { type: "paragraph", text: "Le Partenaire qui refuse la modification peut résilier avant sa date d’effet. La poursuite du programme après cette date vaut acceptation. Une modification ne réduit pas rétroactivement une commission déjà disponible." },
      ],
    },
    {
      id: "preuve",
      title: "Preuve, réclamations et prescription",
      blocks: [
        { type: "paragraph", text: "Les journaux de clic, dossiers, horodatages, confirmations Stripe, écritures de commission, e-mails, acceptations et décisions auditées constituent des éléments de preuve recevables. Une anomalie doit être signalée avec des éléments précis dans les trente jours de son affichage ; ce délai n’emporte pas renonciation à un droit impératif." },
        { type: "paragraph", text: "Les parties s’efforcent de résoudre toute contestation de bonne foi. Entre professionnels, sous réserve d’un délai légal impératif plus long, toute action contractuelle se prescrit dans un délai de douze mois à compter du fait permettant de l’exercer." },
      ],
    },
    {
      id: "general",
      title: "Dispositions générales",
      blocks: [
        { type: "paragraph", text: "Le contrat, la politique de confidentialité, les règles affichées dans le compte et les éventuelles conditions particulières forment l’accord applicable au programme. Le Partenaire ne peut céder son compte ou le contrat sans accord écrit. Wayne-web peut le transférer avec l’activité concernée, sous réserve d’en informer le Partenaire." },
        { type: "paragraph", text: "La nullité d’une stipulation n’affecte pas les autres. L’absence d’exercice d’un droit ne vaut pas renonciation. Les notifications sont valablement adressées aux coordonnées du compte et à celles figurant dans les mentions légales ; chaque partie maintient ses coordonnées à jour." },
      ],
    },
    {
      id: "droit",
      title: "Droit applicable et juridiction",
      blocks: [
        { type: "paragraph", text: "Le contrat est régi par le droit français. Avant toute procédure, les parties tentent une résolution amiable pendant trente jours à compter d’une réclamation écrite suffisamment détaillée." },
        { type: "notice", text: "ENTRE COMMERÇANTS, TOUT LITIGE RELATIF À LA FORMATION, LA VALIDITÉ, L’INTERPRÉTATION, L’EXÉCUTION OU LA FIN DU CONTRAT RELÈVERA DE LA COMPÉTENCE EXCLUSIVE DES TRIBUNAUX DU RESSORT DE TOULOUSE, Y COMPRIS EN CAS DE PLURALITÉ DE DÉFENDEURS OU D’APPEL EN GARANTIE. DANS LES AUTRES CAS, LES RÈGLES IMPÉRATIVES DE COMPÉTENCE S’APPLIQUENT." },
      ],
    },
  ],
};

export const legalDocuments: Record<LegalDocumentKind, LegalDocument> = {
  legal,
  privacy,
  cookies,
  terms,
  affiliateTerms,
};
