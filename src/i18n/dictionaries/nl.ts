import type { PartialDictionary } from "../types";

/**
 * Nederlands — partial. Missing keys fall back to English at runtime.
 * TODO(i18n): professional translation + native review before launch.
 */
const dict: PartialDictionary = {
  meta: { homeTitle: "Studio ATS Partners — Verkoop Studio ATS, verdien tot € 1.500 per verkoop", homeDescription: "Word Studio ATS-partner. Wij bouwen en leveren het — jij brengt de kans en ontvangt 25 % terugkerende commissie." },
  common: { perYear: "/ jaar", copy: "Kopiëren", copied: "Gekopieerd", save: "Opslaan", cancel: "Annuleren", language: "Taal", currency: "Weergavevaluta", currencyNote: "Indicatieve omrekening. Stripe bevestigt de valuta en het definitieve bedrag bij het afrekenen.", theme: "Thema", themeLight: "Licht", themeDark: "Donker", themeSystem: "Systeem", menu: "Menu",
    illustrationOnly: "Puur wiskundige illustraties op basis van de publieke prijs van Studio Premium en het standaard commissiepercentage. Geen inkomensbelofte. Commissies zijn alleen verschuldigd op in aanmerking komende, daadwerkelijk betaalde verkopen." },
  nav: { howItWorks: "Hoe het werkt", whatYouSell: "Wat je verkoopt", markets: "Markten", discover: "Ontdek Studio ATS", faq: "Vragen", login: "Inloggen", becomePartner: "Word partner", pricing: "Prijzen", dashboard: "Dashboard" },
  home: { eyebrow: "Studio ATS Partnerprogramma", heroTitle1: "Verkoop Studio ATS.", heroTitle2: "Verdien tot € 1.500 per verkoop.", heroSubtitle: "Wij bouwen het. Wij leveren het. Jij brengt de kans.", ctaPrimary: "Word partner", ctaSecondary: "Ontdek Studio ATS",
    statPrice: "€ 6.000 / jaar", statPriceLabel: "Publieke prijs Studio Premium", statRate: "25 % terugkerend", statRateLabel: "Commissie", statCommission: "€ 1.500", statCommissionLabel: "Maximale commissie / jaar / actieve klant",
    ladderTitle: "De rekensom is eenvoudig.", ladderClients: "{n} klanten", ladderClient: "1 klant", ladderPerYear: "/ jaar", howTitle: "Drie stappen. Dat is alles.",
    steps: { share: { title: "Deel", body: "Krijg je persoonlijke link en kant-en-klare verkoopberichten." }, sell: { title: "Verkoop", body: "Presenteer Studio ATS aan professionals in de voorgestelde markten." }, earn: { title: "Verdien", body: "Ontvang je commissie op in aanmerking komende, betaalde verkopen." } },
    sellTitle: "Eén plek voor hun bedrijf.", finalTitle: "Je eerste verkoop kan tot € 1.500 commissie opleveren." },
  studio: { heroTitle: "Zet je verkeer om in kansen.", heroTitle2: "Zet kansen om in afspraken.", cta: "Studio ATS aanvragen" },
  auth: { loginTitle: "Welkom terug.", registerTitle: "Word Studio ATS-partner.", email: "E-mail", password: "Wachtwoord", submitLogin: "Inloggen", logout: "Uitloggen" },
  dash: { greetingMorning: "Goedemorgen, {name}.", greetingAfternoon: "Goedemiddag, {name}.", greetingEvening: "Goedenavond, {name}." },
  cookieBanner: { text: "We gebruiken noodzakelijke cookies, waaronder een verwijzingscookie om de partner te herkennen die Studio ATS heeft aanbevolen. Optionele analysecookies blijven uit tot je ze accepteert.", accept: "Analyse toestaan", decline: "Alleen noodzakelijke", policy: "Cookiebeleid" },
};

export default dict;
