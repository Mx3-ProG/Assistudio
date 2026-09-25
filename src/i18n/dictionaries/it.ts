import type { PartialDictionary } from "../types";

/**
 * Italiano — partial. Missing keys fall back to English at runtime.
 * TODO(i18n): professional translation + native review before launch.
 */
const dict: PartialDictionary = {
  meta: { homeTitle: "STUDIO Partners — Vendi STUDIO, guadagna fino a 1.500 € per vendita", homeDescription: "Diventa partner STUDIO. Noi lo costruiamo e lo consegniamo — tu porti l’opportunità e ricevi il 25 % di commissione ricorrente." },
  common: { perYear: "/ anno", copy: "Copia", copied: "Copiato", save: "Salva", cancel: "Annulla", language: "Lingua", theme: "Tema", themeLight: "Chiaro", themeDark: "Scuro", themeSystem: "Sistema", menu: "Menu",
    illustrationOnly: "Illustrazioni puramente matematiche basate sul prezzo pubblico di Studio Premium e sulla commissione standard. Non è una promessa di guadagno. Le commissioni sono dovute solo sulle vendite idonee effettivamente incassate." },
  nav: { howItWorks: "Come funziona", whatYouSell: "Cosa vendi", markets: "Mercati", discover: "Scopri STUDIO", login: "Accedi", becomePartner: "Diventa partner", dashboard: "Dashboard" },
  home: { eyebrow: "Programma partner STUDIO", heroTitle1: "Vendi STUDIO.", heroTitle2: "Guadagna fino a 1.500 € per vendita.", heroSubtitle: "Noi lo costruiamo. Noi lo consegniamo. Tu porti l’opportunità.", ctaPrimary: "Diventa partner", ctaSecondary: "Scopri STUDIO",
    statPrice: "6.000 € / anno", statPriceLabel: "Prezzo pubblico Studio Premium", statRate: "25 % ricorrente", statRateLabel: "Commissione", statCommission: "1.500 €", statCommissionLabel: "Commissione massima / anno / cliente attivo",
    ladderTitle: "Il calcolo è semplice.", ladderClients: "{n} clienti", ladderClient: "1 cliente", ladderPerYear: "/ anno", howTitle: "Tre passi. Tutto qui.",
    steps: { share: { title: "Condividi", body: "Ottieni il tuo link personale e messaggi di vendita pronti." }, sell: { title: "Vendi", body: "Presenta STUDIO ai professionisti dei mercati suggeriti." }, earn: { title: "Guadagna", body: "Ricevi la commissione sulle vendite idonee effettivamente incassate." } },
    sellTitle: "Un unico posto per la loro attività.", finalTitle: "La tua prima vendita potrebbe generare fino a 1.500 € di commissione." },
  studio: { heroTitle: "Trasforma il traffico in opportunità.", heroTitle2: "Trasforma le opportunità in appuntamenti.", cta: "Richiedi STUDIO" },
  auth: { loginTitle: "Bentornato.", registerTitle: "Diventa partner STUDIO.", email: "Email", password: "Password", submitLogin: "Accedi", logout: "Esci" },
  dash: { greetingMorning: "Buongiorno, {name}.", greetingAfternoon: "Buon pomeriggio, {name}.", greetingEvening: "Buonasera, {name}." },
};

export default dict;
