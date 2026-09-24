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
  | "customer.welcome" | "customer.order_confirmation" | "customer.renewal_receipt" | "customer.payment_failed"
  | "customer.cancellation" | "lead.confirmation" | "lead.appointment_confirmation";

export interface TemplateCopy {
  subject: string;
  preheader: string;
  title: string;
  paragraphs: string[];
  cta?: { label: string; path: string };
  footnote?: string;
}

type Copy = { common: { signature: string; footer: string; pendingNote: string }; templates: Record<TemplateId, TemplateCopy> };

const en: Copy = {
  common: {
    signature: "The STUDIO team",
    footer: "You receive this email because of your STUDIO account or request. This is a transactional message.",
    pendingNote: "A pending commission is not yet acquired: it becomes available once the validation period ends without refund or dispute.",
  },
  templates: {
    "affiliate.welcome": {
      subject: "Welcome to STUDIO",
      preheader: "Your partner space is ready.",
      title: "Welcome to STUDIO.",
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
      paragraphs: ["{who} requested information about STUDIO through your link.", "The STUDIO team handles the first contact. You can follow it from your dashboard."],
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
      subject: "New STUDIO sale — {commission} commission pending",
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
      subject: "Welcome to STUDIO",
      preheader: "Your payment is confirmed.",
      title: "Welcome to STUDIO.",
      paragraphs: [
        "Your payment is confirmed and your {product} subscription is active.",
        "Our team will contact you shortly to start. Your receipt and invoices are sent by our payment provider, Stripe.",
      ],
    },
    "customer.order_confirmation": {
      subject: "Your STUDIO order {sale_ref}",
      preheader: "Order confirmed.",
      title: "Your order is confirmed.",
      paragraphs: ["Order {sale_ref}: {amount} paid."],
    },
    "customer.renewal_receipt": {
      subject: "Your STUDIO subscription was renewed",
      preheader: "Renewal confirmed.",
      title: "Your subscription was renewed.",
      paragraphs: ["Renewal {sale_ref}: {amount} paid. Thank you for your trust."],
    },
    "customer.payment_failed": {
      subject: "Your STUDIO payment did not go through",
      preheader: "Please update your payment method.",
      title: "Your payment did not go through.",
      paragraphs: ["We could not collect {amount}. Your bank may have declined the payment. We will retry automatically; you can also update your payment method from the link in our payment provider's email."],
    },
    "customer.cancellation": {
      subject: "Your STUDIO cancellation is confirmed",
      preheader: "Cancellation confirmed.",
      title: "Your cancellation is confirmed.",
      paragraphs: ["Your subscription will not renew. You keep access until {ends_on}.", "If this was a mistake, simply reply to this email."],
    },
    "lead.confirmation": {
      subject: "We received your request — STUDIO",
      preheader: "We will get back to you shortly.",
      title: "Thank you, we received your request.",
      paragraphs: ["A member of the STUDIO team will contact you shortly."],
    },
    "lead.appointment_confirmation": {
      subject: "Your STUDIO appointment request",
      preheader: "We will confirm the time with you.",
      title: "We received your appointment request.",
      paragraphs: ["We will confirm the time with you{when}."],
    },
  },
};

const fr: Partial<Copy> & { templates: Partial<Record<TemplateId, TemplateCopy>> } = {
  common: {
    signature: "L’équipe STUDIO",
    footer: "Vous recevez cet email en lien avec votre compte ou votre demande STUDIO. Message transactionnel.",
    pendingNote: "Une commission en attente n’est pas encore acquise : elle devient disponible à la fin de la période de validation, sans remboursement ni litige.",
  },
  templates: {
    "affiliate.welcome": {
      subject: "Bienvenue dans STUDIO",
      preheader: "Votre espace partenaire est prêt.",
      title: "Bienvenue dans STUDIO.",
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
      paragraphs: ["{who} a demandé des informations sur STUDIO via votre lien.", "L’équipe STUDIO assure le premier contact. Vous pouvez le suivre depuis votre tableau de bord."],
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
      subject: "Nouvelle vente STUDIO — commission de {commission} en attente",
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
      subject: "Bienvenue dans STUDIO",
      preheader: "Votre paiement est confirmé.",
      title: "Bienvenue dans STUDIO.",
      paragraphs: [
        "Votre paiement est confirmé et votre abonnement {product} est actif.",
        "Notre équipe vous contacte très vite pour démarrer. Votre reçu et vos factures sont envoyés par notre prestataire de paiement, Stripe.",
      ],
    },
    "customer.order_confirmation": {
      subject: "Votre commande STUDIO {sale_ref}",
      preheader: "Commande confirmée.",
      title: "Votre commande est confirmée.",
      paragraphs: ["Commande {sale_ref} : {amount} payés."],
    },
    "customer.renewal_receipt": {
      subject: "Votre abonnement STUDIO a été renouvelé",
      preheader: "Renouvellement confirmé.",
      title: "Votre abonnement a été renouvelé.",
      paragraphs: ["Renouvellement {sale_ref} : {amount} payés. Merci de votre confiance."],
    },
    "customer.payment_failed": {
      subject: "Votre paiement STUDIO n’a pas abouti",
      preheader: "Merci de mettre à jour votre moyen de paiement.",
      title: "Votre paiement n’a pas abouti.",
      paragraphs: ["Nous n’avons pas pu encaisser {amount}. Votre banque a peut-être refusé le paiement. Nous réessaierons automatiquement ; vous pouvez aussi mettre à jour votre moyen de paiement via le lien de l’email de notre prestataire."],
    },
    "customer.cancellation": {
      subject: "Votre résiliation STUDIO est confirmée",
      preheader: "Résiliation confirmée.",
      title: "Votre résiliation est confirmée.",
      paragraphs: ["Votre abonnement ne sera pas renouvelé. Vous gardez l’accès jusqu’au {ends_on}.", "S’il s’agit d’une erreur, répondez simplement à cet email."],
    },
    "lead.confirmation": {
      subject: "Nous avons bien reçu votre demande — STUDIO",
      preheader: "Nous revenons vers vous rapidement.",
      title: "Merci, nous avons bien reçu votre demande.",
      paragraphs: ["Un membre de l’équipe STUDIO vous contacte très prochainement."],
    },
    "lead.appointment_confirmation": {
      subject: "Votre demande de rendez-vous STUDIO",
      preheader: "Nous confirmons l’horaire avec vous.",
      title: "Nous avons bien reçu votre demande de rendez-vous.",
      paragraphs: ["Nous confirmons l’horaire avec vous{when}."],
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
