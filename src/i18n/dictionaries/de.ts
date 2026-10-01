import type { PartialDictionary } from "../types";

/**
 * Deutsch — partial. Missing keys fall back to English at runtime.
 * TODO(i18n): professional translation + native review before launch.
 */
const dict: PartialDictionary = {
  meta: { homeTitle: "Studio ATS Partner — Verkaufen Sie Studio ATS, verdienen Sie bis zu 1.500 € pro Verkauf", homeDescription: "Werden Sie Studio ATS-Partner. Wir bauen es, wir liefern es — Sie bringen die Gelegenheit und erhalten 25 % wiederkehrende Provision." },
  common: { perYear: "/ Jahr", copy: "Kopieren", copied: "Kopiert", save: "Speichern", cancel: "Abbrechen", language: "Sprache", currency: "Anzeigewährung", currencyNote: "Nur eine unverbindliche Umrechnung. Stripe bestätigt Währung und Endbetrag beim Bezahlen.", theme: "Design", themeLight: "Hell", themeDark: "Dunkel", themeSystem: "System", menu: "Menü",
    illustrationOnly: "Rein mathematische Beispiele auf Basis des öffentlichen Preises von Studio Premium und des Standard-Provisionssatzes. Kein Einkommensversprechen. Provisionen fallen nur für berechtigte, tatsächlich bezahlte Verkäufe an." },
  nav: { howItWorks: "So funktioniert’s", whatYouSell: "Was Sie verkaufen", markets: "Märkte", discover: "Studio ATS entdecken", faq: "FAQ", login: "Anmelden", becomePartner: "Partner werden", pricing: "Preise", dashboard: "Dashboard" },
  home: { eyebrow: "Studio ATS Partnerprogramm", heroTitle1: "Verkaufen Sie Studio ATS.", heroTitle2: "Verdienen Sie bis zu 1.500 € pro Verkauf.", heroSubtitle: "Wir bauen es. Wir liefern es. Sie bringen die Gelegenheit.", ctaPrimary: "Partner werden", ctaSecondary: "Studio ATS entdecken",
    statPrice: "6.000 € / Jahr", statPriceLabel: "Öffentlicher Preis Studio Premium", statRate: "25 % wiederkehrend", statRateLabel: "Provision", statCommission: "1.500 €", statCommissionLabel: "Maximale Provision / Jahr / aktiver Kunde",
    ladderTitle: "Die Rechnung ist einfach.", ladderClients: "{n} Kunden", ladderClient: "1 Kunde", ladderPerYear: "/ Jahr", howTitle: "Drei Schritte. Das ist alles.",
    steps: { share: { title: "Teilen", body: "Erhalten Sie Ihren persönlichen Link und fertige Verkaufsnachrichten." }, sell: { title: "Verkaufen", body: "Präsentieren Sie Studio ATS Fachleuten in den vorgeschlagenen Märkten." }, earn: { title: "Verdienen", body: "Erhalten Sie Ihre Provision auf berechtigte, bezahlte Verkäufe." } },
    sellTitle: "Ein Ort für ihr Geschäft.", marketsTitle: "Fachleute, bei denen jeder Kunde zählt.", finalTitle: "Ihr erster Verkauf könnte bis zu 1.500 € Provision bringen." },
  studio: { heroTitle: "Verwandeln Sie Traffic in Chancen.", heroTitle2: "Verwandeln Sie Chancen in Termine.", cta: "Studio ATS anfragen" },
  auth: { loginTitle: "Willkommen zurück.", registerTitle: "Werden Sie Studio ATS-Partner.", email: "E-Mail", submitLogin: "Anmelden", logout: "Abmelden" },
  dash: { greetingMorning: "Guten Morgen, {name}.", greetingAfternoon: "Guten Tag, {name}.", greetingEvening: "Guten Abend, {name}." },
  cookieBanner: { text: "Wir verwenden notwendige Cookies, darunter ein Empfehlungs-Cookie zur Zuordnung des vermittelnden Partners. Optionale Analyse-Cookies bleiben deaktiviert, bis Sie zustimmen.", accept: "Analyse erlauben", decline: "Nur notwendige", policy: "Cookie-Richtlinie" },
};

export default dict;
