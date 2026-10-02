import type { NetworkDictionary } from "./network.en";

const net: NetworkDictionary = {
  nav: "Rede",
  helpNav: "Pedidos de ajuda",
  title: "Rede de parceiros",
  subtitle: "Cada parceiro com o seu padrinho, afilhados, prospects, faturação e comissões — e quem precisa de algo de si.",
  kpi: {
    members: "Parceiros", approved: "{n} aprovados", active30d: "Ativos em 30 dias", prospects: "Prospects", paidSales: "Vendas pagas",
    revenue: "Faturação atribuída", owed: "Comissões devidas", owedHint: "Disponíveis, a pagar", paid: "Comissões pagas",
    pending: "Em validação", pendingHint: "Ainda não ganhas", conversion: "Conversão da rede", needAttention: "A tratar", openHelp: "Pedidos de ajuda abertos",
  },
  conversionHint: "Conversão = primeiras vendas pagas ÷ prospects (CRM + leads recebidos; um comprador que nunca foi prospect conta como um). Classificação a partir de {n} prospects.",
  attention: { title: "A tratar", empty: "Ninguém precisa de nada neste momento.", more: "+{n} mais" },
  needs: {
    application: "Candidatura a analisar", help: "Pedido de ajuda aberto", contract: "Contrato à sua espera", payout_due: "Pagamento devido",
    fraud: "Sinal de fraude", disputed: "Comissão contestada", onboarding: "Onboarding por terminar", inactive: "Inativo há 30+ dias",
  },
  rank: {
    title: "Classificações", revenue: "Maior faturação", prospects: "Mais prospects", recruits: "Mais afilhados", conversion: "Melhor conversão",
    sales: "Mais vendas", earned: "Mais ganho", earnedHint: "Disponível + pago", empty: "Ainda sem dados.",
  },
  table: {
    title: "Todos os parceiros", search: "Nome, email, código, país, padrinho…", apply: "Aplicar",
    filters: { all: "Todos", needs: "A tratar", pending: "Candidaturas", inactive: "Inativos", top: "Já venderam" },
    sortBy: "Ordenar",
    sorts: { needs: "Prioridade", recent: "Mais recentes", name: "Nome", revenue: "Faturação", prospects: "Prospects", recruits: "Afilhados", conversion: "Conversão", sales: "Vendas", earned: "Ganho", owed: "Devido" },
    partner: "Parceiro", sponsor: "Padrinho", recruits: "Afilhados", prospects: "Prospects", sales: "Vendas", conversion: "Conv.",
    revenue: "Faturação", owed: "Devido", paid: "Pago", pending: "Em validação", noSponsor: "—", count: "{n} parceiros", empty: "Nenhum parceiro corresponde.", staff: "Equipa",
  },
  tree: { title: "Árvore de apadrinhamento", hint: "Quem recrutou quem. Abra um parceiro para ver tudo.", network: "{n} na sua rede", sales: "{n} vendas" },
  detail: {
    back: "Rede", since: "Parceiro desde {date}", notFound: "Este parceiro não existe.", sponsor: "Padrinho", noSponsor: "Entrou sem padrinho",
    recruits: "Afilhados", noRecruits: "Ainda sem afilhados.", noNeeds: "Nada a fazer para este parceiro.", finance: "Finanças deste parceiro",
    money: {
      title: "Dinheiro", revenue: "Faturação atribuída", available: "Devido agora (disponível)", paid: "Já pago",
      pending: "Em validação (não ganho)", disputed: "Em análise", sponsor: "Dos quais vindos dos afilhados", minimum: "Pagamento mínimo: {amount}",
    },
    stats: {
      title: "Atividade", clicks: "Cliques (30 dias)", lastActivity: "Última atividade", never: "Sem atividade", conversion: "Conversão",
      won: "Ganhos no CRM", leads: "Leads recebidos", renewals: "Renovações pagas",
    },
    sections: { prospects: "Prospects", leads: "Leads recebidos", sales: "Vendas", commissions: "Comissões", payouts: "Pagamentos", help: "Pedidos de ajuda", contracts: "Dossiês de contrato" },
    prospect: { contact: "Contacto", stage: "Etapa", next: "Próxima ação", value: "Potencial", source: "Origem", notes: "Notas", added: "Adicionado" },
    commissionRole: "Venda {sale}", empty: "Nada por agora.", open: "Abrir",
  },
  statuses: { open: "Aberto", in_progress: "Em curso", resolved: "Resolvido", closed: "Fechado" },
  categories: {
    commission: "Comissão", payout: "Pagamento", contract: "Contrato / dossiê", prospect: "Prospect", sale: "Venda",
    account: "Conta", technical: "Problema técnico", training: "Formação / como vender", other: "Outro",
  },
  urgencies: { low: "Baixa", normal: "Normal", high: "Urgente" },
  admin: {
    title: "Pedidos de ajuda",
    subtitle: "O que os parceiros pediram à equipa, com a conta tal como estava no momento do pedido. Cada membro da equipa também o recebe por email.",
    tabs: { open: "A tratar", all: "Todos" }, empty: "Nenhum pedido de ajuda.", context: "Conta no momento do pedido", related: "Relacionado",
    from: "Enviado de", note: "Resposta ao parceiro (opcional, ele vê)", teamNote: "Resposta da equipa", take: "Eu trato",
    resolve: "Marcar como resolvido", close: "Fechar", reopen: "Reabrir", partner: "Ficha do parceiro", saved: "Guardado",
  },
  ctx: {
    affiliate_status: "Estado", code: "Código", sponsor: "Padrinho", recruits: "Afilhados", prospects: "Prospects", leads: "Leads recebidos",
    paid_sales: "Vendas pagas", revenue_cents: "Faturação", available_cents: "Devido", paid_cents: "Pago", pending_cents: "Em validação (não ganho)",
    open_dossiers: "Dossiês abertos", open_requests: "Pedidos abertos", onboarding_completed: "Onboarding concluído", country: "País",
    prospect: "Prospect", dossier: "Dossiê",
  },
  help: {
    nav: "Ajuda",
    title: "Pedir ajuda à equipa Studio ATS",
    subtitle: "Diga-nos do que precisa. A equipa recebe o seu pedido por email com o contexto da sua conta (prospects, vendas, comissões), por isso não tem de explicar tudo de novo.",
    category: "Tema", urgency: "Urgência", urgentHint: "Urgente = um cliente está à espera ou há dinheiro bloqueado.",
    subject: "Assunto", subjectPlaceholder: "Em poucas palavras", message: "O seu pedido",
    messagePlaceholder: "O que aconteceu, o que já tentou, o que precisa de nós.",
    prospect: "Prospect relacionado (opcional)", dossier: "Dossiê de contrato relacionado (opcional)", none: "Nenhum",
    shared: "Partilhado com a equipa: o seu estado, padrinho, números de prospects e vendas, saldos e o prospect ou dossiê escolhido.",
    send: "Enviar à equipa", sending: "A enviar…",
    sent: "Pedido {ref} enviado. A equipa foi avisada por email; receberá uma notificação quando avançar.",
    history: "Os meus pedidos", empty: "Ainda não pediu ajuda.", teamNote: "Resposta da equipa", messages: "Prefere conversar? Escreva à equipa",
    errors: {
      invalid: "Indique um assunto (mín. 3 caracteres) e o seu pedido (mín. 10 caracteres).",
      rate_limited: "Demasiados pedidos na última hora. Aguarde um pouco ou use as Mensagens.",
      generic: "Não foi possível enviar o pedido. Tente novamente ou use as Mensagens.",
    },
    ask: "Precisa de ajuda?",
  },
};

export default net;
