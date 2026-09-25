import type { PartialDictionary } from "../types";

/**
 * Español — partial. Missing keys fall back to English at runtime.
 * TODO(i18n): professional translation + native review before launch.
 */
const dict: PartialDictionary = {
  meta: { homeTitle: "STUDIO Partners — Vende STUDIO, gana hasta 1.500 € por venta", homeDescription: "Hazte partner de STUDIO. Nosotros lo construimos y lo entregamos — tú aportas la oportunidad y ganas un 25 % de comisión recurrente." },
  common: { perYear: "/ año", copy: "Copiar", copied: "Copiado", save: "Guardar", cancel: "Cancelar", language: "Idioma", theme: "Tema", themeLight: "Claro", themeDark: "Oscuro", themeSystem: "Sistema", menu: "Menú",
    illustrationOnly: "Ilustraciones puramente matemáticas basadas en el precio público de Studio Premium y la comisión estándar. No es una promesa de ingresos. Las comisiones solo se deben por ventas elegibles efectivamente cobradas." },
  nav: { howItWorks: "Cómo funciona", whatYouSell: "Qué vendes", markets: "Mercados", discover: "Descubrir STUDIO", login: "Entrar", becomePartner: "Hazte partner", dashboard: "Panel" },
  home: { eyebrow: "Programa de partners STUDIO", heroTitle1: "Vende STUDIO.", heroTitle2: "Gana hasta 1.500 € por venta.", heroSubtitle: "Nosotros lo construimos. Nosotros lo entregamos. Tú aportas la oportunidad.", ctaPrimary: "Hazte partner", ctaSecondary: "Descubrir STUDIO",
    statPrice: "6.000 € / año", statPriceLabel: "Precio público Studio Premium", statRate: "25 % recurrente", statRateLabel: "Comisión", statCommission: "1.500 €", statCommissionLabel: "Comisión máxima / año / cliente activo",
    ladderTitle: "Las cuentas son simples.", ladderClients: "{n} clientes", ladderClient: "1 cliente", ladderPerYear: "/ año", howTitle: "Tres pasos. Nada más.",
    steps: { share: { title: "Comparte", body: "Obtén tu enlace personal y mensajes de venta listos para usar." }, sell: { title: "Vende", body: "Presenta STUDIO a profesionales de los mercados sugeridos." }, earn: { title: "Gana", body: "Recibe tu comisión por las ventas elegibles efectivamente cobradas." } },
    sellTitle: "Un solo lugar para su negocio.", marketsTitle: "Profesionales para quienes cada cliente cuenta.", finalTitle: "Tu primera venta podría generar hasta 1.500 € de comisión." },
  studio: { heroTitle: "Convierte tu tráfico en oportunidades.", heroTitle2: "Convierte tus oportunidades en citas.", cta: "Solicitar STUDIO" },
  auth: { loginTitle: "Bienvenido de nuevo.", registerTitle: "Hazte partner de STUDIO.", email: "Email", password: "Contraseña", submitLogin: "Entrar", logout: "Cerrar sesión" },
  dash: { greetingMorning: "Buenos días, {name}.", greetingAfternoon: "Buenas tardes, {name}.", greetingEvening: "Buenas noches, {name}." },
};

export default dict;
