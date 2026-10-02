import type { NetworkDictionary } from "./network.en";

const net: NetworkDictionary = {
  nav: "Netzwerk",
  helpNav: "Hilfeanfragen",
  title: "Partnernetzwerk",
  subtitle: "Jeder Partner mit Sponsor, geworbenen Partnern, Interessenten, Umsatz und Provisionen — und wer etwas von Ihnen braucht.",
  kpi: {
    members: "Partner", approved: "{n} freigegeben", active30d: "Aktiv in 30 Tagen", prospects: "Interessenten", paidSales: "Bezahlte Verkäufe",
    revenue: "Zugeordneter Umsatz", owed: "Fällige Provisionen", owedHint: "Verfügbar, auszuzahlen", paid: "Ausgezahlte Provisionen",
    pending: "In Prüfung", pendingHint: "Noch nicht verdient", conversion: "Netzwerk-Conversion", needAttention: "Zu bearbeiten", openHelp: "Offene Hilfeanfragen",
  },
  conversionHint: "Conversion = bezahlte Erstverkäufe ÷ Interessenten (CRM + eingehende Leads; ein Käufer ohne Interessenten-Eintrag zählt als einer). Rangliste ab {n} Interessenten.",
  attention: { title: "Zu bearbeiten", empty: "Gerade braucht niemand etwas.", more: "+{n} weitere" },
  needs: {
    application: "Bewerbung prüfen", help: "Offene Hilfeanfrage", contract: "Vertrag wartet auf Sie", payout_due: "Auszahlung fällig",
    fraud: "Betrugssignal", disputed: "Strittige Provision", onboarding: "Onboarding nicht abgeschlossen", inactive: "Seit 30+ Tagen inaktiv",
  },
  rank: {
    title: "Ranglisten", revenue: "Höchster Umsatz", prospects: "Meiste Interessenten", recruits: "Meiste Geworbene", conversion: "Beste Conversion",
    sales: "Meiste Verkäufe", earned: "Meist verdient", earnedHint: "Verfügbar + ausgezahlt", empty: "Noch keine Daten.",
  },
  table: {
    title: "Alle Partner", search: "Name, E-Mail, Code, Land, Sponsor…", apply: "Anwenden",
    filters: { all: "Alle", needs: "Zu bearbeiten", pending: "Bewerbungen", inactive: "Inaktiv", top: "Hat verkauft" },
    sortBy: "Sortieren",
    sorts: { needs: "Priorität", recent: "Neueste", name: "Name", revenue: "Umsatz", prospects: "Interessenten", recruits: "Geworbene", conversion: "Conversion", sales: "Verkäufe", earned: "Verdient", owed: "Fällig" },
    partner: "Partner", sponsor: "Sponsor", recruits: "Geworbene", prospects: "Interessenten", sales: "Verkäufe", conversion: "Conv.",
    revenue: "Umsatz", owed: "Fällig", paid: "Ausgezahlt", pending: "In Prüfung", noSponsor: "—", count: "{n} Partner", empty: "Kein Partner gefunden.", staff: "Team",
  },
  tree: { title: "Sponsoring-Baum", hint: "Wer hat wen geworben. Öffnen Sie einen Partner, um alles zu sehen.", network: "{n} im Netzwerk", sales: "{n} Verkäufe" },
  detail: {
    back: "Netzwerk", since: "Partner seit {date}", notFound: "Diesen Partner gibt es nicht.", sponsor: "Sponsor", noSponsor: "Ohne Sponsor beigetreten",
    recruits: "Geworbene", noRecruits: "Noch keine Geworbenen.", noNeeds: "Für diesen Partner ist nichts zu tun.", finance: "Finanzen dieses Partners",
    money: {
      title: "Geld", revenue: "Zugeordneter Umsatz", available: "Jetzt fällig (verfügbar)", paid: "Bereits ausgezahlt",
      pending: "In Prüfung (nicht verdient)", disputed: "In Klärung", sponsor: "Davon aus Geworbenen", minimum: "Mindestauszahlung: {amount}",
    },
    stats: {
      title: "Aktivität", clicks: "Klicks (30 Tage)", lastActivity: "Letzte Aktivität", never: "Noch keine Aktivität", conversion: "Conversion",
      won: "Im CRM gewonnen", leads: "Eingehende Leads", renewals: "Bezahlte Verlängerungen",
    },
    sections: { prospects: "Interessenten", leads: "Eingehende Leads", sales: "Verkäufe", commissions: "Provisionen", payouts: "Auszahlungen", help: "Hilfeanfragen", contracts: "Vertragsdossiers" },
    prospect: { contact: "Kontakt", stage: "Phase", next: "Nächste Aktion", value: "Potenzial", source: "Quelle", notes: "Notizen", added: "Hinzugefügt" },
    commissionRole: "Verkauf {sale}", empty: "Noch nichts.", open: "Öffnen",
  },
  statuses: { open: "Offen", in_progress: "In Bearbeitung", resolved: "Gelöst", closed: "Geschlossen" },
  categories: {
    commission: "Provision", payout: "Auszahlung", contract: "Vertrag / Dossier", prospect: "Interessent", sale: "Verkauf",
    account: "Konto", technical: "Technisches Problem", training: "Schulung / wie verkaufen", other: "Sonstiges",
  },
  urgencies: { low: "Niedrig", normal: "Normal", high: "Dringend" },
  admin: {
    title: "Hilfeanfragen",
    subtitle: "Was Partner das Team gefragt haben, mit ihrem Konto zum Zeitpunkt der Anfrage. Jedes Teammitglied erhält sie auch per E-Mail.",
    tabs: { open: "Zu bearbeiten", all: "Alle" }, empty: "Keine Hilfeanfrage.", context: "Konto zum Zeitpunkt der Anfrage", related: "Bezug",
    from: "Gesendet von", note: "Antwort an den Partner (optional, sichtbar für ihn)", teamNote: "Antwort des Teams", take: "Übernehmen",
    resolve: "Als gelöst markieren", close: "Schließen", reopen: "Wieder öffnen", partner: "Partnerakte", saved: "Gespeichert",
  },
  ctx: {
    affiliate_status: "Status", code: "Code", sponsor: "Sponsor", recruits: "Geworbene", prospects: "Interessenten", leads: "Eingehende Leads",
    paid_sales: "Bezahlte Verkäufe", revenue_cents: "Umsatz", available_cents: "Fällig", paid_cents: "Ausgezahlt", pending_cents: "In Prüfung (nicht verdient)",
    open_dossiers: "Offene Dossiers", open_requests: "Offene Anfragen", onboarding_completed: "Onboarding abgeschlossen", country: "Land",
    prospect: "Interessent", dossier: "Dossier",
  },
  help: {
    nav: "Hilfe",
    title: "Das Studio ATS-Team fragen",
    subtitle: "Sagen Sie uns, was Sie brauchen. Das Team erhält Ihre Anfrage per E-Mail mit dem Kontext Ihres Kontos (Interessenten, Verkäufe, Provisionen) — Sie müssen nicht alles neu erklären.",
    category: "Thema", urgency: "Dringlichkeit", urgentHint: "Dringend = ein Kunde wartet oder Geld ist blockiert.",
    subject: "Betreff", subjectPlaceholder: "In wenigen Worten", message: "Ihre Anfrage",
    messagePlaceholder: "Was passiert ist, was Sie schon versucht haben, was Sie von uns brauchen.",
    prospect: "Betroffener Interessent (optional)", dossier: "Betroffenes Vertragsdossier (optional)", none: "Keiner",
    shared: "Mit dem Team geteilt: Ihr Status, Sponsor, Anzahl Interessenten und Verkäufe, Salden sowie der gewählte Interessent oder das Dossier.",
    send: "An das Team senden", sending: "Wird gesendet…",
    sent: "Anfrage {ref} gesendet. Das Team wurde per E-Mail informiert; Sie erhalten eine Benachrichtigung, sobald es weitergeht.",
    history: "Meine Anfragen", empty: "Sie haben noch nie um Hilfe gebeten.", teamNote: "Antwort des Teams", messages: "Lieber chatten? Dem Team schreiben",
    errors: {
      invalid: "Bitte Betreff (mind. 3 Zeichen) und Anfrage (mind. 10 Zeichen) ausfüllen.",
      rate_limited: "Zu viele Anfragen in der letzten Stunde. Bitte kurz warten oder Nachrichten nutzen.",
      generic: "Die Anfrage konnte nicht gesendet werden. Erneut versuchen oder Nachrichten nutzen.",
    },
    ask: "Hilfe nötig?",
  },
};

export default net;
