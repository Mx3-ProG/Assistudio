import type { Copy } from "./copy.ts";

/** Nederlands — transactional emails. A pending commission is never described as earned. */
const nl: Copy = {
  common: {
    signature: "Het Studio ATS-team",
    footer: "U ontvangt deze e-mail in verband met uw Studio ATS-account of uw aanvraag. Dit is een transactioneel bericht.",
    pendingNote: "Een openstaande commissie is nog niet verworven: ze komt beschikbaar zodra de validatieperiode zonder terugbetaling of geschil is verstreken.",
  },
  templates: {
    "affiliate.welcome": {
      subject: "Welkom bij Studio ATS",
      preheader: "Uw partneromgeving staat klaar.",
      title: "Welkom bij Studio ATS.",
      paragraphs: [
        "Uw partneromgeving staat klaar. Uw verwijzingscode is {code}.",
        "Deel uw link, volg uw prospects en zie elke verkoop, commissie en verlenging op één plek.",
      ],
      cta: { label: "Mijn dashboard openen", path: "/dashboard" },
    },
    "affiliate.new_lead": {
      subject: "Er is een nieuwe prospect aan u toegewezen",
      preheader: "Er is een nieuwe aanvraag binnengekomen via uw link.",
      title: "Er is een nieuwe prospect aan u toegewezen.",
      paragraphs: ["{who} heeft via uw link informatie over Studio ATS aangevraagd.", "Het Studio ATS-team verzorgt het eerste contact. U kunt het volgen vanuit uw dashboard."],
      cta: { label: "Mijn prospects bekijken", path: "/dashboard/prospects" },
    },
    "affiliate.appointment": {
      subject: "Een prospect heeft een afspraak aangevraagd",
      preheader: "Er is een afspraakverzoek binnengekomen via uw link.",
      title: "Een prospect heeft een afspraak aangevraagd.",
      paragraphs: ["{who} heeft een afspraak aangevraagd{when}."],
      cta: { label: "Mijn prospects bekijken", path: "/dashboard/prospects" },
    },
    "affiliate.sale_detected": {
      subject: "Nieuwe Studio ATS-verkoop — commissie van {commission} in afwachting",
      preheader: "{gross} gegenereerd. Commissie wacht op validatie.",
      title: "Er is een verkoop bevestigd.",
      paragraphs: [
        "Verkoop {sale_ref}: {gross} betaald door de klant.",
        "Uw commissie: {commission} — status: in afwachting. Naar verwachting beschikbaar op {available_on}.",
      ],
      cta: { label: "Mijn commissies volgen", path: "/dashboard/commissions" },
      footnote: "pendingNote",
    },
    "affiliate.renewal": {
      subject: "Een klant heeft verlengd — commissie van {commission} in afwachting",
      preheader: "Een contract dat u aanbracht is verlengd.",
      title: "Een klant die u aanbracht heeft zojuist verlengd.",
      paragraphs: [
        "Verlenging {sale_ref}: {gross} betaald.",
        "Uw verlengingscommissie: {commission} — status: in afwachting. Verwachte beschikbaarheid: {available_on}.",
      ],
      cta: { label: "Mijn terugkerende portefeuille bekijken", path: "/dashboard/recurring" },
      footnote: "pendingNote",
    },
    "affiliate.commission_available": {
      subject: "{commission} is nu beschikbaar",
      preheader: "Uw commissie heeft de validatieperiode doorlopen.",
      title: "Uw commissie is nu beschikbaar.",
      paragraphs: ["{commission} heeft de validatieperiode doorlopen en is nu beschikbaar voor uitbetaling."],
      cta: { label: "Mijn saldo bekijken", path: "/dashboard/payouts" },
    },
    "affiliate.payout_sent": {
      subject: "Uitbetaling verzonden: {amount}",
      preheader: "Er is een uitbetaling aan u gedaan.",
      title: "Er is een uitbetaling naar u verzonden.",
      paragraphs: ["Uitbetaling {payout_ref}: {amount}. Afhankelijk van uw bank komt het geld meestal binnen enkele werkdagen aan."],
      cta: { label: "Mijn uitbetalingen bekijken", path: "/dashboard/payouts" },
    },
    "affiliate.customer_cancelled": {
      subject: "Een contract dat u aanbracht is opgezegd",
      preheader: "Een klant verlengt niet.",
      title: "Een contract dat u aanbracht is opgezegd.",
      paragraphs: [
        "Klant {customer_ref} verlengt niet. Het contract eindigt op {ends_on}.",
        "Reeds gevalideerde commissies voor betaalde periodes blijven ongewijzigd. Voor dit contract ontstaat geen verlengingscommissie.",
      ],
      cta: { label: "Mijn terugkerende portefeuille bekijken", path: "/dashboard/recurring" },
    },
    "customer.welcome": {
      subject: "Welkom bij Studio ATS",
      preheader: "Uw betaling is bevestigd.",
      title: "Welkom bij Studio ATS.",
      paragraphs: [
        "Uw betaling is bevestigd en uw {product}-abonnement is actief.",
        "Ons team neemt binnenkort contact met u op om te starten. Uw betaalbewijs en facturen worden verstuurd door onze betaaldienstverlener, Stripe.",
      ],
    },
    "customer.order_confirmation": {
      subject: "Uw Studio ATS-bestelling {sale_ref}",
      preheader: "Bestelling bevestigd.",
      title: "Uw bestelling is bevestigd.",
      paragraphs: ["Bestelling {sale_ref}: {amount} betaald."],
    },
    "customer.renewal_receipt": {
      subject: "Uw Studio ATS-abonnement is verlengd",
      preheader: "Verlenging bevestigd.",
      title: "Uw abonnement is verlengd.",
      paragraphs: ["Verlenging {sale_ref}: {amount} betaald. Bedankt voor uw vertrouwen."],
    },
    "customer.payment_failed": {
      subject: "Uw Studio ATS-betaling is mislukt",
      preheader: "Werk uw betaalmethode bij.",
      title: "Uw betaling is mislukt.",
      paragraphs: ["We konden {amount} niet innen. Mogelijk heeft uw bank de betaling geweigerd. We proberen het automatisch opnieuw; u kunt uw betaalmethode ook bijwerken via de link in de e-mail van onze betaaldienstverlener."],
    },
    "customer.cancellation": {
      subject: "Uw opzegging bij Studio ATS is bevestigd",
      preheader: "Opzegging bevestigd.",
      title: "Uw opzegging is bevestigd.",
      paragraphs: ["Uw abonnement wordt niet verlengd. U houdt toegang tot {ends_on}.", "Was dit een vergissing? Beantwoord dan gewoon deze e-mail."],
    },
    "lead.confirmation": {
      subject: "We hebben uw aanvraag ontvangen — Studio ATS",
      preheader: "We nemen snel contact met u op.",
      title: "Bedankt, we hebben uw aanvraag ontvangen.",
      paragraphs: ["Een lid van het Studio ATS-team neemt binnenkort contact met u op."],
    },
    "lead.appointment_confirmation": {
      subject: "Uw afspraakverzoek bij Studio ATS",
      preheader: "We stemmen het tijdstip met u af.",
      title: "We hebben uw afspraakverzoek ontvangen.",
      paragraphs: ["We stemmen het tijdstip met u af{when}."],
    },
    "dossier.invite": {
      subject: "Vul uw Studio ATS-projectbrief in - {reference}",
      preheader: "Uw beveiligde projectomgeving staat klaar.",
      title: "Vertel ons over uw project.",
      paragraphs: ["Uw Studio ATS-adviseur heeft dossier {reference} aangemaakt.", "Gebruik de beveiligde link hieronder om uw projectbrief in te vullen. De link is persoonlijk en verloopt automatisch."],
      cta: { label: "Mijn dossier openen", path: "{access_path}" },
    },
    "dossier.changes_requested": {
      subject: "Wijzigingen gevraagd voor dossier {reference}",
      preheader: "Uw adviseur heeft een opmerking achtergelaten.",
      title: "Enkele gegevens vragen uw aandacht.",
      paragraphs: ["Opmerking: {comment}", "Open het beveiligde dossier om het bij te werken en een nieuwe revisie in te dienen."],
      cta: { label: "Mijn dossier bijwerken", path: "{access_path}" },
    },
    "dossier.ready_to_accept": {
      subject: "Uw Studio ATS-offerte is klaar - {reference}",
      preheader: "Bekijk de vergrendelde brief en offerte.",
      title: "Uw documenten zijn klaar voor akkoord.",
      paragraphs: ["Bekijk de exacte projectbrief en offerte die voor dossier {reference} zijn opgesteld.", "Vraag, zodra u klaar bent, de eenmalige code aan om uw akkoord te bevestigen."],
      cta: { label: "Mijn documenten bekijken", path: "{access_path}" },
    },
    "dossier.otp": {
      subject: "Uw Studio ATS-akkoordcode",
      preheader: "Deze code verloopt over 10 minuten.",
      title: "Uw eenmalige code is {otp}.",
      paragraphs: ["Voer deze code in om akkoord te gaan met dossier {reference}.", "Hij verloopt over 10 minuten en kan maar één keer worden gebruikt."],
    },
    "dossier.payment": {
      subject: "Rond de betaling voor Studio ATS af - {reference}",
      preheader: "Uw dossier is medeondertekend.",
      title: "Uw Studio ATS-dossier is volledig geaccepteerd.",
      paragraphs: ["Studio ATS heeft dezelfde vergrendelde documenten medeondertekend.", "Doe de eerste betaling via Stripe om de bestelling bindend te maken."],
      cta: { label: "Veilig betalen", path: "{payment_url}" },
    },
    "dossier.active": {
      subject: "Uw Studio ATS-bestelling is bevestigd - {reference}",
      preheader: "Betaling bevestigd.",
      title: "Uw Studio ATS-project kan beginnen.",
      paragraphs: ["We hebben de eerste betaling voor dossier {reference} ontvangen.", "Uw geaccepteerde documenten en het bewijsdossier blijven beschikbaar in uw beveiligde dossier."],
      cta: { label: "Mijn dossier openen", path: "{access_path}" },
    },
    "system.test": {
      subject: "Studio ATS — test-e-mail",
      preheader: "Het versturen van e-mails werkt.",
      title: "Het versturen van e-mails werkt.",
      paragraphs: ["Deze test is verstuurd vanuit de beheerinstellingen van Studio ATS. Kunt u hem lezen, dan bereiken inlogcodes en meldingen uw gebruikers."],
    },
    "auth.login_code": {
      subject: "Uw Studio ATS-inlogcode: {code}",
      preheader: "5 minuten geldig, eenmalig te gebruiken.",
      title: "Uw inlogcode",
      paragraphs: ["Voer deze code in op Studio ATS om in te loggen. Hij is 5 minuten geldig en werkt maar één keer."],
      highlight: "{code}",
      footnote: "Hebt u deze code niet aangevraagd? Negeer deze e-mail en deel de code nooit.",
    },
  },
};

export default nl;
