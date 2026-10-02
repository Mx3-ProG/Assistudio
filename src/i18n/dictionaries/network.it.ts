import type { NetworkDictionary } from "./network.en";

const net: NetworkDictionary = {
  nav: "Rete",
  helpNav: "Richieste di aiuto",
  title: "Rete di partner",
  subtitle: "Ogni partner con il suo sponsor, i suoi affiliati, prospect, fatturato e commissioni — e chi ha bisogno di qualcosa da te.",
  kpi: {
    members: "Partner", approved: "{n} approvati", active30d: "Attivi negli ultimi 30 giorni", prospects: "Prospect", paidSales: "Vendite pagate",
    revenue: "Fatturato attribuito", owed: "Commissioni dovute", owedHint: "Disponibili, da pagare", paid: "Commissioni pagate",
    pending: "In convalida", pendingHint: "Non ancora maturate", conversion: "Conversione della rete", needAttention: "Da gestire", openHelp: "Richieste di aiuto aperte",
  },
  conversionHint: "Conversione = prime vendite pagate ÷ prospect (CRM + lead in entrata; un acquirente mai registrato come prospect conta come tale). Classifica a partire da {n} prospect.",
  attention: { title: "Da gestire", empty: "Al momento nessuno ha bisogno di nulla.", more: "+{n} altri" },
  needs: {
    application: "Candidatura da esaminare", help: "Richiesta di aiuto aperta", contract: "Contratto in attesa di te", payout_due: "Pagamento dovuto",
    fraud: "Segnale di frode", disputed: "Commissione contestata", onboarding: "Onboarding non completato", inactive: "Inattivo da 30+ giorni",
  },
  rank: {
    title: "Classifiche", revenue: "Maggior fatturato", prospects: "Più prospect", recruits: "Più affiliati", conversion: "Miglior conversione",
    sales: "Più vendite", earned: "Più guadagnato", earnedHint: "Disponibile + pagato", empty: "Ancora nessun dato.",
  },
  table: {
    title: "Tutti i partner", search: "Nome, email, codice, paese, sponsor…", apply: "Applica",
    filters: { all: "Tutti", needs: "Da gestire", pending: "Candidature", inactive: "Inattivi", top: "Hanno venduto" },
    sortBy: "Ordina",
    sorts: { needs: "Priorità", recent: "Più recenti", name: "Nome", revenue: "Fatturato", prospects: "Prospect", recruits: "Affiliati", conversion: "Conversione", sales: "Vendite", earned: "Guadagnato", owed: "Dovuto" },
    partner: "Partner", sponsor: "Sponsor", recruits: "Affiliati", prospects: "Prospect", sales: "Vendite", conversion: "Conv.",
    revenue: "Fatturato", owed: "Dovuto", paid: "Pagato", pending: "In convalida", noSponsor: "—", count: "{n} partner", empty: "Nessun partner corrisponde.", staff: "Team",
  },
  tree: { title: "Albero delle sponsorizzazioni", hint: "Chi ha reclutato chi. Apri un partner per vedere tutto.", network: "{n} nella sua rete", sales: "{n} vendite" },
  detail: {
    back: "Rete", since: "Partner dal {date}", notFound: "Questo partner non esiste.", sponsor: "Sponsor", noSponsor: "Iscritto senza sponsor",
    recruits: "Affiliati", noRecruits: "Ancora nessun affiliato.", noNeeds: "Niente da fare per questo partner.", finance: "Finanze di questo partner",
    money: {
      title: "Denaro", revenue: "Fatturato attribuito", available: "Dovuto ora (disponibile)", paid: "Già pagato",
      pending: "In convalida (non maturato)", disputed: "In verifica", sponsor: "Di cui dagli affiliati", minimum: "Pagamento minimo: {amount}",
    },
    stats: {
      title: "Attività", clicks: "Clic (30 giorni)", lastActivity: "Ultima attività", never: "Nessuna attività", conversion: "Conversione",
      won: "Vinti nel CRM", leads: "Lead in entrata", renewals: "Rinnovi pagati",
    },
    sections: { prospects: "Prospect", leads: "Lead in entrata", sales: "Vendite", commissions: "Commissioni", payouts: "Pagamenti", help: "Richieste di aiuto", contracts: "Dossier contratto" },
    prospect: { contact: "Contatto", stage: "Fase", next: "Prossima azione", value: "Potenziale", source: "Fonte", notes: "Note", added: "Aggiunto" },
    commissionRole: "Vendita {sale}", empty: "Ancora niente.", open: "Apri",
  },
  statuses: { open: "Aperta", in_progress: "In corso", resolved: "Risolta", closed: "Chiusa" },
  categories: {
    commission: "Commissione", payout: "Pagamento", contract: "Contratto / dossier", prospect: "Prospect", sale: "Vendita",
    account: "Account", technical: "Problema tecnico", training: "Formazione / come vendere", other: "Altro",
  },
  urgencies: { low: "Bassa", normal: "Normale", high: "Urgente" },
  admin: {
    title: "Richieste di aiuto",
    subtitle: "Cosa hanno chiesto i partner al team, con il loro account com'era al momento della richiesta. Ogni membro del team la riceve anche via email.",
    tabs: { open: "Da gestire", all: "Tutte" }, empty: "Nessuna richiesta di aiuto.", context: "Account al momento della richiesta", related: "Collegato a",
    from: "Inviata da", note: "Risposta al partner (facoltativa, la vedrà)", teamNote: "Risposta del team", take: "Me ne occupo io",
    resolve: "Segna come risolta", close: "Chiudi", reopen: "Riapri", partner: "Scheda partner", saved: "Salvato",
  },
  ctx: {
    affiliate_status: "Stato", code: "Codice", sponsor: "Sponsor", recruits: "Affiliati", prospects: "Prospect", leads: "Lead in entrata",
    paid_sales: "Vendite pagate", revenue_cents: "Fatturato", available_cents: "Dovuto", paid_cents: "Pagato", pending_cents: "In convalida (non maturato)",
    open_dossiers: "Dossier aperti", open_requests: "Richieste aperte", onboarding_completed: "Onboarding completato", country: "Paese",
    prospect: "Prospect", dossier: "Dossier",
  },
  help: {
    nav: "Aiuto",
    title: "Chiedi aiuto al team Studio ATS",
    subtitle: "Dicci di cosa hai bisogno. Il team riceve la tua richiesta via email con il contesto del tuo account (prospect, vendite, commissioni): non devi rispiegare tutto.",
    category: "Argomento", urgency: "Urgenza", urgentHint: "Urgente = un cliente aspetta o del denaro è bloccato.",
    subject: "Oggetto", subjectPlaceholder: "In poche parole", message: "La tua richiesta",
    messagePlaceholder: "Cosa è successo, cosa hai già provato, di cosa hai bisogno da noi.",
    prospect: "Prospect collegato (facoltativo)", dossier: "Dossier contratto collegato (facoltativo)", none: "Nessuno",
    shared: "Condiviso con il team: il tuo stato, lo sponsor, i numeri di prospect e vendite, i saldi e il prospect o dossier scelto.",
    send: "Invia al team", sending: "Invio…",
    sent: "Richiesta {ref} inviata. Il team è stato avvisato via email; riceverai una notifica quando avanza.",
    history: "Le mie richieste", empty: "Non hai ancora chiesto aiuto.", teamNote: "Risposta del team", messages: "Preferisci chattare? Scrivi al team",
    errors: {
      invalid: "Inserisci un oggetto (min. 3 caratteri) e la tua richiesta (min. 10 caratteri).",
      rate_limited: "Troppe richieste nell'ultima ora. Attendi un po' o usa i Messaggi.",
      generic: "Impossibile inviare la richiesta. Riprova o usa i Messaggi.",
    },
    ask: "Serve aiuto?",
  },
};

export default net;
