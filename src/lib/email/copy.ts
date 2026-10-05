/**
 * Transactional email copy — one place, per locale. English is the reference;
 * other locales fall back to it key by key. {placeholders} are filled by the
 * renderer with already-formatted, HTML-escaped values.
 *
 * Tone rule: a commission that is still `pending` is never described as earned.
 */
export type TemplateId =
  | "affiliate.welcome" | "affiliate.new_lead" | "affiliate.appointment" | "affiliate.sale_detected"
  | "affiliate.commission_available" | "affiliate.payout_sent" | "affiliate.renewal" | "affiliate.customer_cancelled"
  | "affiliate.payout_requested" | "affiliate.payout_rejected" | "staff.payout_request"
  | "customer.welcome" | "customer.order_confirmation" | "customer.renewal_receipt" | "customer.payment_failed"
  | "customer.cancellation" | "lead.confirmation" | "lead.appointment_confirmation"
  | "dossier.invite" | "dossier.changes_requested" | "dossier.ready_to_accept"
  | "dossier.otp" | "dossier.payment" | "dossier.active" | "staff.help_request"
  | "staff.contact_request" | "newsletter.confirmation" | "system.test";

export interface TemplateCopy {
  subject: string;
  preheader: string;
  title: string;
  paragraphs: string[];
  cta?: { label: string; path: string };
  /** Shown large and spaced (one-time codes). */
  highlight?: string;
  footnote?: string;
}

type Copy = { common: { signature: string; footer: string; pendingNote: string }; templates: Record<TemplateId, TemplateCopy> };

const en: Copy = {
  common: {
    signature: "The Studio ATS team",
    footer: "You receive this email because of your Studio ATS account or request. This is a transactional message.",
    pendingNote: "A pending commission is not yet acquired: it becomes available once the validation period ends without refund or dispute.",
  },
  templates: {
    "affiliate.welcome": {
      subject: "Welcome to Studio ATS",
      preheader: "Your partner space is ready.",
      title: "Welcome to Studio ATS.",
      paragraphs: [
        "Your partner space is ready. Your referral code is {code}.",
        "Share your link, follow your prospects and see every sale, commission and renewal in one place.",
      ],
      cta: { label: "Open my dashboard", path: "/dashboard" },
    },
    "affiliate.new_lead": {
      subject: "New prospect attributed to you",
      preheader: "A new request came through your link.",
      title: "A new prospect was attributed to you.",
      paragraphs: ["{who} requested information about Studio ATS through your link.", "The Studio ATS team handles the first contact. You can follow it from your dashboard."],
      cta: { label: "View my prospects", path: "/dashboard/prospects" },
    },
    "affiliate.appointment": {
      subject: "A prospect requested an appointment",
      preheader: "An appointment request came through your link.",
      title: "A prospect requested an appointment.",
      paragraphs: ["{who} asked for an appointment{when}."],
      cta: { label: "View my prospects", path: "/dashboard/prospects" },
    },
    "affiliate.sale_detected": {
      subject: "New Studio ATS sale — {commission} commission pending",
      preheader: "{gross} generated. Commission pending validation.",
      title: "A sale was confirmed.",
      paragraphs: [
        "Sale {sale_ref}: {gross} paid by the customer.",
        "Your commission: {commission} — status: pending. It is expected to become available on {available_on}.",
      ],
      cta: { label: "Follow my commissions", path: "/dashboard/commissions" },
      footnote: "pendingNote",
    },
    "affiliate.renewal": {
      subject: "A customer renewed — {commission} commission pending",
      preheader: "A contract you brought renewed.",
      title: "A customer you brought just renewed.",
      paragraphs: [
        "Renewal {sale_ref}: {gross} paid.",
        "Your renewal commission: {commission} — status: pending. Expected availability: {available_on}.",
      ],
      cta: { label: "View my recurring book", path: "/dashboard/recurring" },
      footnote: "pendingNote",
    },
    "affiliate.commission_available": {
      subject: "{commission} is now available",
      preheader: "Your commission passed the validation period.",
      title: "Your commission is now available.",
      paragraphs: ["{commission} passed the validation period and is now available for payout."],
      cta: { label: "View my balance", path: "/dashboard/payouts" },
    },
    "affiliate.payout_sent": {
      subject: "Payout sent: {amount}",
      preheader: "A payout was issued to you.",
      title: "A payout was sent to you.",
      paragraphs: ["Payout {payout_ref}: {amount}. Depending on your bank, funds usually arrive within a few business days."],
      cta: { label: "View my payouts", path: "/dashboard/payouts" },
    },
    "affiliate.payout_requested": {
      subject: "Your payout request has been received",
      preheader: "Payout request {payout_ref}: {amount}.",
      title: "Hello {first_name}, we have received your payout request.",
      paragraphs: [
        "Amount requested: {amount}\nReference: {payout_ref}",
        "The Studio ATS team processes it and you can follow its status at any time in your Studio ATS space.",
      ],
      cta: { label: "Follow my payout", path: "/dashboard/payouts" },
    },
    "affiliate.payout_rejected": {
      subject: "Your payout request {payout_ref} was declined",
      preheader: "Reason: {reason}",
      title: "Your payout request was declined.",
      paragraphs: [
        "Payout request {payout_ref} ({amount}) was declined by the Studio ATS team.\nReason: {reason}",
        "What is still available is back in your balance: you can submit a new request from your payouts page.",
      ],
      cta: { label: "View my payouts", path: "/dashboard/payouts" },
    },
    "staff.payout_request": {
      subject: "New payout request — Studio ATS",
      preheader: "{affiliate_name} requests {amount} ({payout_ref}).",
      title: "New partner payout request",
      paragraphs: [
        "Partner: {affiliate_name}\nEmail: {affiliate_email}",
        "Amount requested: {amount}\nAvailable balance before the request: {balance_before}\nReference: {payout_ref}\nDate: {requested_on}\nPayout method: {method_label}",
      ],
      cta: { label: "View the request", path: "{admin_path}" },
      footnote: "Accept, pay and mark as paid from the admin (Partner payouts): the partner is notified at each step.",
    },
    "affiliate.customer_cancelled": {
      subject: "A contract you brought was cancelled",
      preheader: "A customer will not renew.",
      title: "A contract you brought was cancelled.",
      paragraphs: [
        "Customer {customer_ref} will not renew. The contract ends on {ends_on}.",
        "Commissions already validated for paid periods are not affected. No renewal commission will be generated for this contract.",
      ],
      cta: { label: "View my recurring book", path: "/dashboard/recurring" },
    },
    "customer.welcome": {
      subject: "Welcome to Studio ATS",
      preheader: "Your payment is confirmed.",
      title: "Welcome to Studio ATS.",
      paragraphs: [
        "Your payment is confirmed and your {product} subscription is active.",
        "Our team will contact you shortly to start. Your receipt and invoices are sent by our payment provider, Stripe.",
      ],
    },
    "customer.order_confirmation": {
      subject: "Your Studio ATS order {sale_ref}",
      preheader: "Order confirmed.",
      title: "Your order is confirmed.",
      paragraphs: ["Order {sale_ref}: {amount} paid."],
    },
    "customer.renewal_receipt": {
      subject: "Your Studio ATS subscription was renewed",
      preheader: "Renewal confirmed.",
      title: "Your subscription was renewed.",
      paragraphs: ["Renewal {sale_ref}: {amount} paid. Thank you for your trust."],
    },
    "customer.payment_failed": {
      subject: "Your Studio ATS payment did not go through",
      preheader: "Please update your payment method.",
      title: "Your payment did not go through.",
      paragraphs: ["We could not collect {amount}. Your bank may have declined the payment. We will retry automatically; you can also update your payment method from the link in our payment provider's email."],
    },
    "customer.cancellation": {
      subject: "Your Studio ATS cancellation is confirmed",
      preheader: "Cancellation confirmed.",
      title: "Your cancellation is confirmed.",
      paragraphs: ["Your subscription will not renew. You keep access until {ends_on}.", "If this was a mistake, simply reply to this email."],
    },
    "lead.confirmation": {
      subject: "We received your request — Studio ATS",
      preheader: "We will get back to you shortly.",
      title: "Thank you, we received your request.",
      paragraphs: ["A member of the Studio ATS team will contact you shortly."],
    },
    "lead.appointment_confirmation": {
      subject: "Your Studio ATS appointment request",
      preheader: "We will confirm the time with you.",
      title: "We received your appointment request.",
      paragraphs: ["We will confirm the time with you{when}."],
    },
    "dossier.invite": {
      subject: "Complete your Studio ATS project brief - {reference}",
      preheader: "Your secure project space is ready.",
      title: "Tell us about your project.",
      paragraphs: ["Your Studio ATS advisor created dossier {reference}.", "Use the secure link below to complete your project brief. The link is personal and expires automatically."],
      cta: { label: "Open my dossier", path: "{access_path}" },
    },
    "dossier.changes_requested": {
      subject: "Updates requested for dossier {reference}",
      preheader: "Your advisor left a comment.",
      title: "A few details need your attention.",
      paragraphs: ["Comment: {comment}", "Open the secure dossier to update and submit a new revision."],
      cta: { label: "Update my dossier", path: "{access_path}" },
    },
    "dossier.ready_to_accept": {
      subject: "Your Studio ATS quote is ready - {reference}",
      preheader: "Review the locked brief and quote.",
      title: "Your documents are ready for acceptance.",
      paragraphs: ["Review the exact project brief and quote prepared for dossier {reference}.", "When you are ready, request the one-time code to confirm your acceptance."],
      cta: { label: "Review my documents", path: "{access_path}" },
    },
    "dossier.otp": {
      subject: "Your Studio ATS acceptance code",
      preheader: "This code expires in 10 minutes.",
      title: "Your one-time code is {otp}.",
      paragraphs: ["Enter this code to accept dossier {reference}.", "It expires in 10 minutes and can only be used once."],
    },
    "dossier.payment": {
      subject: "Complete payment for Studio ATS - {reference}",
      preheader: "Your dossier has been countersigned.",
      title: "Your Studio ATS dossier is fully accepted.",
      paragraphs: ["Studio ATS countersigned the same locked documents.", "Complete the first payment through Stripe to make the order binding."],
      cta: { label: "Pay securely", path: "{payment_url}" },
    },
    "dossier.active": {
      subject: "Your Studio ATS order is confirmed - {reference}",
      preheader: "Payment confirmed.",
      title: "Your Studio ATS project can begin.",
      paragraphs: ["We received the first payment for dossier {reference}.", "Your accepted documents and evidence record remain available from your secure dossier."],
      cta: { label: "Open my dossier", path: "{access_path}" },
    },
    "staff.help_request": {
      subject: "[{urgency_label}] Help request {ref} — {affiliate_name}: {subject}",
      preheader: "{category_label} · {affiliate_name} needs help.",
      title: "{affiliate_name} needs help: {subject}",
      paragraphs: [
        "{message}",
        "Topic: {category_label} · Urgency: {urgency_label} · Reference: {ref}\nFrom: {affiliate_name} <{affiliate_email}> · code {code} · status {affiliate_status} · sponsor {sponsor}\nSent from: {page}",
        "{related}",
        "Account at the time of the request\nRecruits: {recruits} · Prospects: {prospects} · Inbound leads: {leads} · Paid sales: {paid_sales} · Open contract dossiers: {open_dossiers}\nAttributed revenue: {revenue} · Commissions available (owed): {available} · Already paid: {paid} · Pending validation (not earned yet): {pending}",
      ],
      cta: { label: "Open this partner in the admin", path: "{admin_path}" },
      footnote: "Reply from the admin (Help requests) so the partner is notified. Replying to this email does not reach them.",
    },
    "staff.contact_request": {
      subject: "New contact request — {full_name}",
      preheader: "A visitor wrote to Studio ATS.",
      title: "A new contact request has arrived.",
      paragraphs: [
        "Name: {full_name}\nEmail: {email}\nPhone: {phone}",
        "Activity or company: {company}",
        "Message:\n{message}",
        "Source: {source}",
      ],
    },
    "newsletter.confirmation": {
      subject: "You are subscribed to Studio ATS updates",
      preheader: "Services, product updates and useful digital insights.",
      title: "Welcome to the Studio ATS newsletter.",
      paragraphs: [
        "You will occasionally receive news about our services, Studio ATS updates and useful changes in the digital world.",
        "You can unsubscribe at any time by replying to one of our emails.",
      ],
    },
    "system.test": {
      subject: "Studio ATS — test email",
      preheader: "Email delivery works.",
      title: "Email delivery works.",
      paragraphs: ["This test was sent from the Studio ATS admin settings. If you can read it, sign-in codes and notifications can reach your users."],
    },
  },
};

const fr: Partial<Copy> & { templates: Partial<Record<TemplateId, TemplateCopy>> } = {
  common: {
    signature: "L’équipe Studio ATS",
    footer: "Vous recevez cet email en lien avec votre compte ou votre demande Studio ATS. Message transactionnel.",
    pendingNote: "Une commission en attente n’est pas encore acquise : elle devient disponible à la fin de la période de validation, sans remboursement ni litige.",
  },
  templates: {
    "affiliate.welcome": {
      subject: "Bienvenue dans Studio ATS",
      preheader: "Votre espace partenaire est prêt.",
      title: "Bienvenue dans Studio ATS.",
      paragraphs: [
        "Votre espace partenaire est prêt. Votre code de parrainage : {code}.",
        "Partagez votre lien, suivez vos prospects et retrouvez chaque vente, commission et renouvellement au même endroit.",
      ],
      cta: { label: "Ouvrir mon tableau de bord", path: "/dashboard" },
    },
    "affiliate.new_lead": {
      subject: "Un nouveau prospect vous a été attribué",
      preheader: "Une nouvelle demande est arrivée via votre lien.",
      title: "Un nouveau prospect vous a été attribué.",
      paragraphs: ["{who} a demandé des informations sur Studio ATS via votre lien.", "L’équipe Studio ATS assure le premier contact. Vous pouvez le suivre depuis votre tableau de bord."],
      cta: { label: "Voir mes prospects", path: "/dashboard/prospects" },
    },
    "affiliate.appointment": {
      subject: "Un prospect a demandé un rendez-vous",
      preheader: "Une demande de rendez-vous est arrivée via votre lien.",
      title: "Un prospect a demandé un rendez-vous.",
      paragraphs: ["{who} a demandé un rendez-vous{when}."],
      cta: { label: "Voir mes prospects", path: "/dashboard/prospects" },
    },
    "affiliate.sale_detected": {
      subject: "Nouvelle vente Studio ATS — commission de {commission} en attente",
      preheader: "{gross} générés. Commission en attente de validation.",
      title: "Une vente a été confirmée.",
      paragraphs: [
        "Vente {sale_ref} : {gross} payés par le client.",
        "Votre commission : {commission} — statut : en attente. Disponibilité prévue le {available_on}.",
      ],
      cta: { label: "Suivre mes commissions", path: "/dashboard/commissions" },
      footnote: "pendingNote",
    },
    "affiliate.renewal": {
      subject: "Un client a renouvelé — commission de {commission} en attente",
      preheader: "Un contrat que vous avez apporté a été renouvelé.",
      title: "Un client que vous avez apporté vient de renouveler.",
      paragraphs: [
        "Renouvellement {sale_ref} : {gross} payés.",
        "Votre commission de renouvellement : {commission} — statut : en attente. Disponibilité prévue : {available_on}.",
      ],
      cta: { label: "Voir mon portefeuille récurrent", path: "/dashboard/recurring" },
      footnote: "pendingNote",
    },
    "affiliate.commission_available": {
      subject: "{commission} sont maintenant disponibles",
      preheader: "Votre commission a passé la période de validation.",
      title: "Votre commission est maintenant disponible.",
      paragraphs: ["{commission} ont passé la période de validation et sont disponibles pour un paiement."],
      cta: { label: "Voir mon solde", path: "/dashboard/payouts" },
    },
    "affiliate.payout_sent": {
      subject: "Paiement envoyé : {amount}",
      preheader: "Un paiement vous a été versé.",
      title: "Un paiement vous a été envoyé.",
      paragraphs: ["Paiement {payout_ref} : {amount}. Selon votre banque, les fonds arrivent généralement sous quelques jours ouvrés."],
      cta: { label: "Voir mes paiements", path: "/dashboard/payouts" },
    },
    "affiliate.payout_requested": {
      subject: "Votre demande de paiement a bien été reçue",
      preheader: "Demande de paiement {payout_ref} : {amount}.",
      title: "Bonjour {first_name}, nous avons bien reçu votre demande de paiement.",
      paragraphs: [
        "Montant demandé : {amount}\nRéférence : {payout_ref}",
        "L’équipe Studio ATS la traite et vous pouvez suivre son état à tout moment depuis votre espace Studio ATS.",
      ],
      cta: { label: "Suivre mon paiement", path: "/dashboard/payouts" },
    },
    "affiliate.payout_rejected": {
      subject: "Votre demande de paiement {payout_ref} a été refusée",
      preheader: "Raison : {reason}",
      title: "Votre demande de paiement a été refusée.",
      paragraphs: [
        "La demande de paiement {payout_ref} ({amount}) a été refusée par l’équipe Studio ATS.\nRaison : {reason}",
        "Ce qui reste disponible est revenu dans votre solde : vous pouvez faire une nouvelle demande depuis votre page Paiements.",
      ],
      cta: { label: "Voir mes paiements", path: "/dashboard/payouts" },
    },
    "staff.payout_request": {
      subject: "Nouvelle demande de paiement — Studio ATS",
      preheader: "{affiliate_name} demande {amount} ({payout_ref}).",
      title: "Nouvelle demande de paiement ambassadeur",
      paragraphs: [
        "Ambassadeur : {affiliate_name}\nEmail : {affiliate_email}",
        "Montant demandé : {amount}\nSolde disponible avant demande : {balance_before}\nRéférence : {payout_ref}\nDate : {requested_on}\nMoyen de paiement : {method_label}",
      ],
      cta: { label: "Voir la demande", path: "{admin_path}" },
      footnote: "Acceptez, payez puis marquez comme payé depuis l’admin (Paiements partenaires) : le partenaire est prévenu à chaque étape.",
    },
    "affiliate.customer_cancelled": {
      subject: "Un contrat que vous avez apporté a été résilié",
      preheader: "Un client ne renouvellera pas.",
      title: "Un contrat que vous avez apporté a été résilié.",
      paragraphs: [
        "Le client {customer_ref} ne renouvellera pas. Le contrat se termine le {ends_on}.",
        "Les commissions déjà validées pour les périodes payées ne sont pas affectées. Aucune commission de renouvellement ne sera générée pour ce contrat.",
      ],
      cta: { label: "Voir mon portefeuille récurrent", path: "/dashboard/recurring" },
    },
    "customer.welcome": {
      subject: "Bienvenue dans Studio ATS",
      preheader: "Votre paiement est confirmé.",
      title: "Bienvenue dans Studio ATS.",
      paragraphs: [
        "Votre paiement est confirmé et votre abonnement {product} est actif.",
        "Notre équipe vous contacte très vite pour démarrer. Votre reçu et vos factures sont envoyés par notre prestataire de paiement, Stripe.",
      ],
    },
    "customer.order_confirmation": {
      subject: "Votre commande Studio ATS {sale_ref}",
      preheader: "Commande confirmée.",
      title: "Votre commande est confirmée.",
      paragraphs: ["Commande {sale_ref} : {amount} payés."],
    },
    "customer.renewal_receipt": {
      subject: "Votre abonnement Studio ATS a été renouvelé",
      preheader: "Renouvellement confirmé.",
      title: "Votre abonnement a été renouvelé.",
      paragraphs: ["Renouvellement {sale_ref} : {amount} payés. Merci de votre confiance."],
    },
    "customer.payment_failed": {
      subject: "Votre paiement Studio ATS n’a pas abouti",
      preheader: "Merci de mettre à jour votre moyen de paiement.",
      title: "Votre paiement n’a pas abouti.",
      paragraphs: ["Nous n’avons pas pu encaisser {amount}. Votre banque a peut-être refusé le paiement. Nous réessaierons automatiquement ; vous pouvez aussi mettre à jour votre moyen de paiement via le lien de l’email de notre prestataire."],
    },
    "customer.cancellation": {
      subject: "Votre résiliation Studio ATS est confirmée",
      preheader: "Résiliation confirmée.",
      title: "Votre résiliation est confirmée.",
      paragraphs: ["Votre abonnement ne sera pas renouvelé. Vous gardez l’accès jusqu’au {ends_on}.", "S’il s’agit d’une erreur, répondez simplement à cet email."],
    },
    "lead.confirmation": {
      subject: "Nous avons bien reçu votre demande — Studio ATS",
      preheader: "Nous revenons vers vous rapidement.",
      title: "Merci, nous avons bien reçu votre demande.",
      paragraphs: ["Un membre de l’équipe Studio ATS vous contacte très prochainement."],
    },
    "lead.appointment_confirmation": {
      subject: "Votre demande de rendez-vous Studio ATS",
      preheader: "Nous confirmons l’horaire avec vous.",
      title: "Nous avons bien reçu votre demande de rendez-vous.",
      paragraphs: ["Nous confirmons l’horaire avec vous{when}."],
    },
    "dossier.invite": {
      subject: "Complétez votre cahier des charges Studio ATS - {reference}",
      preheader: "Votre espace projet sécurisé est prêt.",
      title: "Parlez-nous de votre projet.",
      paragraphs: ["Votre conseiller Studio ATS a créé le dossier {reference}.", "Utilisez le lien sécurisé ci-dessous pour compléter le cahier des charges. Ce lien personnel expire automatiquement."],
      cta: { label: "Ouvrir mon dossier", path: "{access_path}" },
    },
    "dossier.changes_requested": {
      subject: "Corrections demandées pour le dossier {reference}",
      preheader: "Votre conseiller a laissé un commentaire.",
      title: "Quelques informations sont à préciser.",
      paragraphs: ["Commentaire : {comment}", "Ouvrez le dossier sécurisé pour le mettre à jour et soumettre une nouvelle révision."],
      cta: { label: "Modifier mon dossier", path: "{access_path}" },
    },
    "dossier.ready_to_accept": {
      subject: "Votre devis Studio ATS est prêt - {reference}",
      preheader: "Relisez le cahier des charges et le devis verrouillés.",
      title: "Vos documents sont prêts à être acceptés.",
      paragraphs: ["Relisez les documents exacts préparés pour le dossier {reference}.", "Lorsque vous êtes prêt, demandez le code ponctuel pour confirmer votre acceptation."],
      cta: { label: "Relire mes documents", path: "{access_path}" },
    },
    "dossier.otp": {
      subject: "Votre code d’acceptation Studio ATS",
      preheader: "Ce code expire dans 10 minutes.",
      title: "Votre code ponctuel est {otp}.",
      paragraphs: ["Saisissez ce code pour accepter le dossier {reference}.", "Il expire dans 10 minutes et ne peut être utilisé qu’une fois."],
    },
    "dossier.payment": {
      subject: "Finalisez le paiement Studio ATS - {reference}",
      preheader: "Votre dossier a été contresigné.",
      title: "Votre dossier Studio ATS est entièrement accepté.",
      paragraphs: ["Studio ATS a contresigné les mêmes documents verrouillés.", "Effectuez le premier paiement via Stripe pour rendre la commande ferme."],
      cta: { label: "Payer de manière sécurisée", path: "{payment_url}" },
    },
    "dossier.active": {
      subject: "Votre commande Studio ATS est confirmée - {reference}",
      preheader: "Paiement confirmé.",
      title: "Votre projet Studio ATS peut commencer.",
      paragraphs: ["Nous avons reçu le premier paiement du dossier {reference}.", "Vos documents acceptés et le dossier de preuve restent disponibles dans votre espace sécurisé."],
      cta: { label: "Ouvrir mon dossier", path: "{access_path}" },
    },
    "staff.help_request": {
      subject: "[{urgency_label}] Demande d’aide {ref} — {affiliate_name} : {subject}",
      preheader: "{category_label} · {affiliate_name} a besoin d’aide.",
      title: "{affiliate_name} a besoin d’aide : {subject}",
      paragraphs: [
        "{message}",
        "Sujet : {category_label} · Urgence : {urgency_label} · Référence : {ref}\nDe : {affiliate_name} <{affiliate_email}> · code {code} · statut {affiliate_status} · parrain {sponsor}\nEnvoyée depuis : {page}",
        "{related}",
        "Compte au moment de la demande\nFilleuls : {recruits} · Prospects : {prospects} · Leads entrants : {leads} · Ventes payées : {paid_sales} · Dossiers contrat ouverts : {open_dossiers}\nCA attribué : {revenue} · Commissions disponibles (dues) : {available} · Déjà versées : {paid} · En validation (pas encore acquises) : {pending}",
      ],
      cta: { label: "Ouvrir ce partenaire dans l’admin", path: "{admin_path}" },
      footnote: "Répondez depuis l’admin (Demandes d’aide) pour que le partenaire soit notifié. Répondre à cet email ne lui parvient pas.",
    },
    "staff.contact_request": {
      subject: "Nouvelle demande de contact — {full_name}",
      preheader: "Un visiteur a écrit à Studio ATS.",
      title: "Une nouvelle demande de contact est arrivée.",
      paragraphs: [
        "Nom : {full_name}\nEmail : {email}\nTéléphone : {phone}",
        "Activité ou entreprise : {company}",
        "Message :\n{message}",
        "Source : {source}",
      ],
    },
    "newsletter.confirmation": {
      subject: "Votre inscription aux actualités Studio ATS",
      preheader: "Services, nouveautés produit et évolutions utiles du numérique.",
      title: "Bienvenue dans la newsletter Studio ATS.",
      paragraphs: [
        "Vous recevrez occasionnellement nos nouveaux services, les évolutions de Studio ATS et une lecture utile des changements du monde numérique.",
        "Vous pourrez vous désinscrire à tout moment en répondant à l’un de nos emails.",
      ],
    },
    "system.test": {
      subject: "Studio ATS — email de test",
      preheader: "L’envoi des emails fonctionne.",
      title: "L’envoi des emails fonctionne.",
      paragraphs: ["Ce test a été envoyé depuis les paramètres admin de Studio ATS. Si vous le lisez, les codes de connexion et les notifications peuvent atteindre vos utilisateurs."],
    },
  },
};

const byLocale: Record<string, Partial<Copy> & { templates: Partial<Record<TemplateId, TemplateCopy>> }> = { fr };

export function copyFor(locale: string): Copy {
  const o = byLocale[locale];
  if (!o) return en;
  return { common: { ...en.common, ...o.common }, templates: { ...en.templates, ...o.templates } };
}

export const TEMPLATE_IDS = Object.keys(en.templates) as TemplateId[];
