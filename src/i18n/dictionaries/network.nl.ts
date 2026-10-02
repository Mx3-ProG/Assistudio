import type { NetworkDictionary } from "./network.en";

const net: NetworkDictionary = {
  nav: "Netwerk",
  helpNav: "Hulpvragen",
  title: "Partnernetwerk",
  subtitle: "Elke partner met sponsor, aangeworven partners, prospects, omzet en commissies — en wie iets van je nodig heeft.",
  kpi: {
    members: "Partners", approved: "{n} goedgekeurd", active30d: "Actief in 30 dagen", prospects: "Prospects", paidSales: "Betaalde verkopen",
    revenue: "Toegewezen omzet", owed: "Verschuldigde commissies", owedHint: "Beschikbaar, uit te betalen", paid: "Uitbetaalde commissies",
    pending: "In validatie", pendingHint: "Nog niet verdiend", conversion: "Netwerkconversie", needAttention: "Te behandelen", openHelp: "Open hulpvragen",
  },
  conversionHint: "Conversie = betaalde eerste verkopen ÷ prospects (CRM + inkomende leads; een koper die nooit prospect was telt als één). Rangschikking vanaf {n} prospects.",
  attention: { title: "Te behandelen", empty: "Niemand heeft nu iets nodig.", more: "+{n} meer" },
  needs: {
    application: "Aanvraag te beoordelen", help: "Open hulpvraag", contract: "Contract wacht op jou", payout_due: "Uitbetaling verschuldigd",
    fraud: "Fraudesignaal", disputed: "Betwiste commissie", onboarding: "Onboarding niet afgerond", inactive: "30+ dagen inactief",
  },
  rank: {
    title: "Ranglijsten", revenue: "Meeste omzet", prospects: "Meeste prospects", recruits: "Meeste aangeworven", conversion: "Beste conversie",
    sales: "Meeste verkopen", earned: "Meest verdiend", earnedHint: "Beschikbaar + uitbetaald", empty: "Nog geen gegevens.",
  },
  table: {
    title: "Alle partners", search: "Naam, e-mail, code, land, sponsor…", apply: "Toepassen",
    filters: { all: "Alle", needs: "Te behandelen", pending: "Aanvragen", inactive: "Inactief", top: "Heeft verkocht" },
    sortBy: "Sorteren",
    sorts: { needs: "Prioriteit", recent: "Nieuwste", name: "Naam", revenue: "Omzet", prospects: "Prospects", recruits: "Aangeworven", conversion: "Conversie", sales: "Verkopen", earned: "Verdiend", owed: "Verschuldigd" },
    partner: "Partner", sponsor: "Sponsor", recruits: "Aangeworven", prospects: "Prospects", sales: "Verkopen", conversion: "Conv.",
    revenue: "Omzet", owed: "Verschuldigd", paid: "Uitbetaald", pending: "In validatie", noSponsor: "—", count: "{n} partners", empty: "Geen partner gevonden.", staff: "Team",
  },
  tree: { title: "Sponsorboom", hint: "Wie heeft wie aangeworven. Open een partner om alles te zien.", network: "{n} in netwerk", sales: "{n} verkopen" },
  detail: {
    back: "Netwerk", since: "Partner sinds {date}", notFound: "Deze partner bestaat niet.", sponsor: "Sponsor", noSponsor: "Aangesloten zonder sponsor",
    recruits: "Aangeworven", noRecruits: "Nog niemand aangeworven.", noNeeds: "Niets te doen voor deze partner.", finance: "Financiën van deze partner",
    money: {
      title: "Geld", revenue: "Toegewezen omzet", available: "Nu verschuldigd (beschikbaar)", paid: "Al uitbetaald",
      pending: "In validatie (niet verdiend)", disputed: "In behandeling", sponsor: "Waarvan via aangeworven partners", minimum: "Minimale uitbetaling: {amount}",
    },
    stats: {
      title: "Activiteit", clicks: "Kliks (30 dagen)", lastActivity: "Laatste activiteit", never: "Nog geen activiteit", conversion: "Conversie",
      won: "Gewonnen in CRM", leads: "Inkomende leads", renewals: "Betaalde verlengingen",
    },
    sections: { prospects: "Prospects", leads: "Inkomende leads", sales: "Verkopen", commissions: "Commissies", payouts: "Uitbetalingen", help: "Hulpvragen", contracts: "Contractdossiers" },
    prospect: { contact: "Contact", stage: "Fase", next: "Volgende actie", value: "Potentieel", source: "Bron", notes: "Notities", added: "Toegevoegd" },
    commissionRole: "Verkoop {sale}", empty: "Nog niets.", open: "Openen",
  },
  statuses: { open: "Open", in_progress: "In behandeling", resolved: "Opgelost", closed: "Gesloten" },
  categories: {
    commission: "Commissie", payout: "Uitbetaling", contract: "Contract / dossier", prospect: "Prospect", sale: "Verkoop",
    account: "Account", technical: "Technisch probleem", training: "Training / hoe verkopen", other: "Overig",
  },
  urgencies: { low: "Laag", normal: "Normaal", high: "Dringend" },
  admin: {
    title: "Hulpvragen",
    subtitle: "Wat partners het team vroegen, met hun account zoals het was op het moment van de vraag. Elk teamlid ontvangt ze ook per e-mail.",
    tabs: { open: "Te behandelen", all: "Alle" }, empty: "Geen hulpvragen.", context: "Account op het moment van de vraag", related: "Gekoppeld aan",
    from: "Verstuurd vanaf", note: "Antwoord aan de partner (optioneel, zichtbaar voor hem)", teamNote: "Antwoord van het team", take: "Ik pak het op",
    resolve: "Markeren als opgelost", close: "Sluiten", reopen: "Heropenen", partner: "Partnerdossier", saved: "Opgeslagen",
  },
  ctx: {
    affiliate_status: "Status", code: "Code", sponsor: "Sponsor", recruits: "Aangeworven", prospects: "Prospects", leads: "Inkomende leads",
    paid_sales: "Betaalde verkopen", revenue_cents: "Omzet", available_cents: "Verschuldigd", paid_cents: "Uitbetaald", pending_cents: "In validatie (niet verdiend)",
    open_dossiers: "Open dossiers", open_requests: "Open vragen", onboarding_completed: "Onboarding afgerond", country: "Land",
    prospect: "Prospect", dossier: "Dossier",
  },
  help: {
    nav: "Hulp",
    title: "Vraag het Studio ATS-team",
    subtitle: "Vertel ons wat je nodig hebt. Het team ontvangt je vraag per e-mail met de context van je account (prospects, verkopen, commissies), zodat je niet alles opnieuw hoeft uit te leggen.",
    category: "Onderwerp", urgency: "Urgentie", urgentHint: "Dringend = een klant wacht of er staat geld vast.",
    subject: "Titel", subjectPlaceholder: "In een paar woorden", message: "Je vraag",
    messagePlaceholder: "Wat er gebeurde, wat je al hebt geprobeerd, wat je van ons nodig hebt.",
    prospect: "Betreffende prospect (optioneel)", dossier: "Betreffend contractdossier (optioneel)", none: "Geen",
    shared: "Gedeeld met het team: je status, sponsor, aantallen prospects en verkopen, saldi en de gekozen prospect of het gekozen dossier.",
    send: "Naar het team sturen", sending: "Versturen…",
    sent: "Vraag {ref} verstuurd. Het team is per e-mail op de hoogte gebracht; je krijgt een melding zodra er iets verandert.",
    history: "Mijn vragen", empty: "Je hebt nog nooit om hulp gevraagd.", teamNote: "Antwoord van het team", messages: "Liever chatten? Stuur het team een bericht",
    errors: {
      invalid: "Vul een titel (min. 3 tekens) en je vraag (min. 10 tekens) in.",
      rate_limited: "Te veel vragen in het afgelopen uur. Wacht even of gebruik Berichten.",
      generic: "De vraag kon niet worden verstuurd. Probeer opnieuw of gebruik Berichten.",
    },
    ask: "Hulp nodig?",
  },
};

export default net;
