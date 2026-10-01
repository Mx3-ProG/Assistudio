import type { PartialDictionary } from "../types";

/**
 * Português — partial. Missing keys fall back to English at runtime.
 * TODO(i18n): professional translation + native review before launch.
 */
const dict: PartialDictionary = {
  meta: { homeTitle: "Studio ATS Partners — Venda Studio ATS, ganhe até 1500 € por venda", homeDescription: "Torne-se parceiro Studio ATS. Nós construímos e entregamos — você traz a oportunidade e recebe 25 % de comissão recorrente." },
  common: { perYear: "/ ano", copy: "Copiar", copied: "Copiado", save: "Guardar", cancel: "Cancelar", language: "Idioma", currency: "Moeda apresentada", currencyNote: "Conversão indicativa. A Stripe confirmará a moeda e o valor final no pagamento.", theme: "Tema", themeLight: "Claro", themeDark: "Escuro", themeSystem: "Sistema", menu: "Menu",
    illustrationOnly: "Ilustrações puramente matemáticas com base no preço público do Studio Premium e na comissão padrão. Não é uma promessa de rendimentos. As comissões só são devidas em vendas elegíveis efetivamente pagas." },
  nav: { howItWorks: "Como funciona", whatYouSell: "O que vende", markets: "Mercados", discover: "Descobrir Studio ATS", faq: "Perguntas", login: "Entrar", becomePartner: "Tornar-se parceiro", pricing: "Preços", dashboard: "Painel" },
  home: { eyebrow: "Programa de parceiros Studio ATS", heroTitle1: "Venda Studio ATS.", heroTitle2: "Ganhe até 1500 € por venda.", heroSubtitle: "Nós construímos. Nós entregamos. Você traz a oportunidade.", ctaPrimary: "Tornar-se parceiro", ctaSecondary: "Descobrir Studio ATS",
    statPrice: "6000 € / ano", statPriceLabel: "Preço público Studio Premium", statRate: "25 % recorrente", statRateLabel: "Comissão", statCommission: "1500 €", statCommissionLabel: "Comissão máxima / ano / cliente ativo",
    ladderTitle: "A conta é simples.", ladderClients: "{n} clientes", ladderClient: "1 cliente", ladderPerYear: "/ ano", howTitle: "Três passos. Só isso.",
    steps: { share: { title: "Partilhe", body: "Obtenha o seu link pessoal e mensagens de venda prontas." }, sell: { title: "Venda", body: "Apresente Studio ATS a profissionais dos mercados sugeridos." }, earn: { title: "Ganhe", body: "Receba a sua comissão sobre vendas elegíveis efetivamente pagas." } },
    sellTitle: "Um só lugar para o negócio deles.", finalTitle: "A sua primeira venda pode gerar até 1500 € de comissão." },
  studio: { heroTitle: "Transforme o seu tráfego em oportunidades.", heroTitle2: "Transforme oportunidades em reuniões.", cta: "Pedir Studio ATS" },
  auth: { loginTitle: "Bem-vindo de volta.", registerTitle: "Torne-se parceiro Studio ATS.", email: "Email", submitLogin: "Entrar", logout: "Sair" },
  dash: { greetingMorning: "Bom dia, {name}.", greetingAfternoon: "Boa tarde, {name}.", greetingEvening: "Boa noite, {name}." },
  cookieBanner: { text: "Utilizamos cookies necessários, incluindo um cookie de referência para atribuir o parceiro que recomendou o Studio ATS. Os cookies analíticos opcionais ficam desativados até aceitar.", accept: "Aceitar análise", decline: "Apenas necessários", policy: "Política de cookies" },
};

export default dict;
