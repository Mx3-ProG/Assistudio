import type { PartialDictionary } from "../types";

/**
 * Nederlands — partial. Missing keys fall back to English at runtime.
 * TODO(i18n): professional translation + native review before launch.
 */
const dict: PartialDictionary = {
  meta: { homeTitle: "STUDIO Partners — Verkoop STUDIO, verdien tot € 1.500 per verkoop", homeDescription: "Word STUDIO-partner. Wij bouwen en leveren het — jij brengt de kans en ontvangt 25 % terugkerende commissie." },
  common: { perYear: "/ jaar", copy: "Kopiëren", copied: "Gekopieerd", save: "Opslaan", cancel: "Annuleren", language: "Taal", theme: "Thema", themeLight: "Licht", themeDark: "Donker", themeSystem: "Systeem", menu: "Menu",
    illustrationOnly: "Puur wiskundige illustraties op basis van de publieke prijs van Studio Premium en het standaard commissiepercentage. Geen inkomensbelofte. Commissies zijn alleen verschuldigd op in aanmerking komende, daadwerkelijk betaalde verkopen." },
  nav: { howItWorks: "Hoe het werkt", whatYouSell: "Wat je verkoopt", markets: "Markten", discover: "Ontdek STUDIO", login: "Inloggen", becomePartner: "Word partner", dashboard: "Dashboard" },
  home: { eyebrow: "STUDIO Partnerprogramma", heroTitle1: "Verkoop STUDIO.", heroTitle2: "Verdien tot € 1.500 per verkoop.", heroSubtitle: "Wij bouwen het. Wij leveren het. Jij brengt de kans.", ctaPrimary: "Word partner", ctaSecondary: "Ontdek STUDIO",
    statPrice: "€ 6.000 / jaar", statPriceLabel: "Publieke prijs Studio Premium", statRate: "25 % terugkerend", statRateLabel: "Commissie", statCommission: "€ 1.500", statCommissionLabel: "Maximale commissie / jaar / actieve klant",
    ladderTitle: "De rekensom is eenvoudig.", ladderClients: "{n} klanten", ladderClient: "1 klant", ladderPerYear: "/ jaar", howTitle: "Drie stappen. Dat is alles.",
    steps: { share: { title: "Deel", body: "Krijg je persoonlijke link en kant-en-klare verkoopberichten." }, sell: { title: "Verkoop", body: "Presenteer STUDIO aan professionals in de voorgestelde markten." }, earn: { title: "Verdien", body: "Ontvang je commissie op in aanmerking komende, betaalde verkopen." } },
    sellTitle: "Eén plek voor hun bedrijf.", finalTitle: "Je eerste verkoop kan tot € 1.500 commissie opleveren." },
  studio: { heroTitle: "Zet je verkeer om in kansen.", heroTitle2: "Zet kansen om in afspraken.", cta: "STUDIO aanvragen" },
  auth: { loginTitle: "Welkom terug.", registerTitle: "Word STUDIO-partner.", email: "E-mail", password: "Wachtwoord", submitLogin: "Inloggen", logout: "Uitloggen" },
  dash: { greetingMorning: "Goedemorgen, {name}.", greetingAfternoon: "Goedemiddag, {name}.", greetingEvening: "Goedenavond, {name}." },
};

export default dict;
