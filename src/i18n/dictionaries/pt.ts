import type { PartialDictionary } from "../types";

/**
 * Português — partial. Missing keys fall back to English at runtime.
 * TODO(i18n): professional translation + native review before launch.
 */
const dict: PartialDictionary = {
  meta: { homeTitle: "STUDIO Partners — Venda STUDIO, ganhe 1500 € por venda", homeDescription: "Torne-se parceiro STUDIO. Nós construímos e entregamos — você traz a oportunidade e recebe 50 % de comissão recorrente." },
  common: { perYear: "/ ano", copy: "Copiar", copied: "Copiado", save: "Guardar", cancel: "Cancelar", language: "Idioma", theme: "Tema", themeLight: "Claro", themeDark: "Escuro", themeSystem: "Sistema", menu: "Menu",
    illustrationOnly: "Ilustrações puramente matemáticas com base no preço público e na comissão padrão. Não é uma promessa de rendimentos. As comissões só são devidas em vendas elegíveis efetivamente pagas." },
  nav: { howItWorks: "Como funciona", whatYouSell: "O que vende", markets: "Mercados", discover: "Descobrir STUDIO", login: "Entrar", becomePartner: "Tornar-se parceiro", dashboard: "Painel" },
  home: { eyebrow: "Programa de parceiros STUDIO", heroTitle1: "Venda STUDIO.", heroTitle2: "Ganhe 1500 € por venda.", heroSubtitle: "Nós construímos. Nós entregamos. Você traz a oportunidade.", ctaPrimary: "Tornar-se parceiro", ctaSecondary: "Descobrir STUDIO",
    statPrice: "3000 € / ano", statPriceLabel: "Preço público", statRate: "50 % recorrente", statRateLabel: "Comissão", statCommission: "1500 €", statCommissionLabel: "Comissão potencial / ano / cliente ativo",
    ladderTitle: "A conta é simples.", ladderClients: "{n} clientes", ladderClient: "1 cliente", ladderPerYear: "/ ano", howTitle: "Três passos. Só isso.",
    steps: { share: { title: "Partilhe", body: "Obtenha o seu link pessoal e mensagens de venda prontas." }, sell: { title: "Venda", body: "Apresente STUDIO a profissionais dos mercados sugeridos." }, earn: { title: "Ganhe", body: "Receba a sua comissão sobre vendas elegíveis efetivamente pagas." } },
    sellTitle: "Um só lugar para o negócio deles.", finalTitle: "A sua primeira venda pode gerar 1500 € de comissão." },
  studio: { heroTitle: "Transforme o seu tráfego em oportunidades.", heroTitle2: "Transforme oportunidades em reuniões.", cta: "Pedir STUDIO", pricingPeriod: "por ano" },
  auth: { loginTitle: "Bem-vindo de volta.", registerTitle: "Torne-se parceiro STUDIO.", email: "Email", password: "Palavra-passe", submitLogin: "Entrar", logout: "Sair" },
  dash: { greetingMorning: "Bom dia, {name}.", greetingAfternoon: "Boa tarde, {name}.", greetingEvening: "Boa noite, {name}." },
};

export default dict;
