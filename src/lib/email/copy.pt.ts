import type { Copy } from "./copy.ts";

/** Português — transactional emails. A pending commission is never described as earned. */
const pt: Copy = {
  common: {
    signature: "A equipa Studio ATS",
    footer: "Recebe este e-mail por causa da sua conta ou do seu pedido na Studio ATS. Esta é uma mensagem transacional.",
    pendingNote: "Uma comissão pendente ainda não está adquirida: fica disponível no fim do período de validação, sem reembolso nem litígio.",
  },
  templates: {
    "affiliate.welcome": {
      subject: "Bem-vindo à Studio ATS",
      preheader: "O seu espaço de parceiro está pronto.",
      title: "Bem-vindo à Studio ATS.",
      paragraphs: [
        "O seu espaço de parceiro está pronto. O seu código de referência é {code}.",
        "Partilhe o seu link, acompanhe os seus contactos e veja cada venda, comissão e renovação num só lugar.",
      ],
      cta: { label: "Abrir o meu painel", path: "/dashboard" },
    },
    "affiliate.new_lead": {
      subject: "Foi-lhe atribuído um novo contacto",
      preheader: "Chegou um novo pedido através do seu link.",
      title: "Foi-lhe atribuído um novo contacto.",
      paragraphs: ["{who} pediu informações sobre a Studio ATS através do seu link.", "A equipa Studio ATS trata do primeiro contacto. Pode acompanhá-lo a partir do seu painel."],
      cta: { label: "Ver os meus contactos", path: "/dashboard/prospects" },
    },
    "affiliate.appointment": {
      subject: "Um contacto pediu uma reunião",
      preheader: "Chegou um pedido de reunião através do seu link.",
      title: "Um contacto pediu uma reunião.",
      paragraphs: ["{who} pediu uma reunião{when}."],
      cta: { label: "Ver os meus contactos", path: "/dashboard/prospects" },
    },
    "affiliate.sale_detected": {
      subject: "Nova venda Studio ATS — comissão de {commission} pendente",
      preheader: "{gross} gerados. Comissão a aguardar validação.",
      title: "Foi confirmada uma venda.",
      paragraphs: [
        "Venda {sale_ref}: {gross} pagos pelo cliente.",
        "A sua comissão: {commission} — estado: pendente. Disponibilidade prevista a {available_on}.",
      ],
      cta: { label: "Acompanhar as minhas comissões", path: "/dashboard/commissions" },
      footnote: "pendingNote",
    },
    "affiliate.renewal": {
      subject: "Um cliente renovou — comissão de {commission} pendente",
      preheader: "Um contrato que trouxe foi renovado.",
      title: "Um cliente que trouxe acabou de renovar.",
      paragraphs: [
        "Renovação {sale_ref}: {gross} pagos.",
        "A sua comissão de renovação: {commission} — estado: pendente. Disponibilidade prevista: {available_on}.",
      ],
      cta: { label: "Ver a minha carteira recorrente", path: "/dashboard/recurring" },
      footnote: "pendingNote",
    },
    "affiliate.commission_available": {
      subject: "{commission} já estão disponíveis",
      preheader: "A sua comissão passou o período de validação.",
      title: "A sua comissão já está disponível.",
      paragraphs: ["{commission} passaram o período de validação e estão disponíveis para pagamento."],
      cta: { label: "Ver o meu saldo", path: "/dashboard/payouts" },
    },
    "affiliate.payout_sent": {
      subject: "Pagamento enviado: {amount}",
      preheader: "Foi-lhe emitido um pagamento.",
      title: "Foi-lhe enviado um pagamento.",
      paragraphs: ["Pagamento {payout_ref}: {amount}. Consoante o seu banco, os fundos chegam normalmente em poucos dias úteis."],
      cta: { label: "Ver os meus pagamentos", path: "/dashboard/payouts" },
    },
    "affiliate.customer_cancelled": {
      subject: "Um contrato que trouxe foi cancelado",
      preheader: "Um cliente não vai renovar.",
      title: "Um contrato que trouxe foi cancelado.",
      paragraphs: [
        "O cliente {customer_ref} não vai renovar. O contrato termina a {ends_on}.",
        "As comissões já validadas por períodos pagos não são afetadas. Este contrato não gerará comissão de renovação.",
      ],
      cta: { label: "Ver a minha carteira recorrente", path: "/dashboard/recurring" },
    },
    "customer.welcome": {
      subject: "Bem-vindo à Studio ATS",
      preheader: "O seu pagamento está confirmado.",
      title: "Bem-vindo à Studio ATS.",
      paragraphs: [
        "O seu pagamento está confirmado e a sua subscrição {product} está ativa.",
        "A nossa equipa vai contactá-lo em breve para começar. O recibo e as faturas são enviados pelo nosso prestador de pagamentos, a Stripe.",
      ],
    },
    "customer.order_confirmation": {
      subject: "A sua encomenda Studio ATS {sale_ref}",
      preheader: "Encomenda confirmada.",
      title: "A sua encomenda está confirmada.",
      paragraphs: ["Encomenda {sale_ref}: {amount} pagos."],
    },
    "customer.renewal_receipt": {
      subject: "A sua subscrição Studio ATS foi renovada",
      preheader: "Renovação confirmada.",
      title: "A sua subscrição foi renovada.",
      paragraphs: ["Renovação {sale_ref}: {amount} pagos. Obrigado pela sua confiança."],
    },
    "customer.payment_failed": {
      subject: "O seu pagamento Studio ATS não foi concluído",
      preheader: "Atualize o seu método de pagamento.",
      title: "O seu pagamento não foi concluído.",
      paragraphs: ["Não conseguimos cobrar {amount}. É possível que o seu banco tenha recusado o pagamento. Vamos tentar novamente de forma automática; também pode atualizar o seu método de pagamento através do link no e-mail do nosso prestador de pagamentos."],
    },
    "customer.cancellation": {
      subject: "O seu cancelamento Studio ATS está confirmado",
      preheader: "Cancelamento confirmado.",
      title: "O seu cancelamento está confirmado.",
      paragraphs: ["A sua subscrição não será renovada. Mantém o acesso até {ends_on}.", "Se foi um engano, basta responder a este e-mail."],
    },
    "lead.confirmation": {
      subject: "Recebemos o seu pedido — Studio ATS",
      preheader: "Entraremos em contacto em breve.",
      title: "Obrigado, recebemos o seu pedido.",
      paragraphs: ["Um membro da equipa Studio ATS vai contactá-lo muito em breve."],
    },
    "lead.appointment_confirmation": {
      subject: "O seu pedido de reunião Studio ATS",
      preheader: "Vamos confirmar a hora consigo.",
      title: "Recebemos o seu pedido de reunião.",
      paragraphs: ["Vamos confirmar a hora consigo{when}."],
    },
    "dossier.invite": {
      subject: "Preencha o seu caderno de encargos Studio ATS - {reference}",
      preheader: "O seu espaço de projeto seguro está pronto.",
      title: "Fale-nos do seu projeto.",
      paragraphs: ["O seu consultor Studio ATS criou o processo {reference}.", "Use o link seguro abaixo para preencher o caderno de encargos. O link é pessoal e expira automaticamente."],
      cta: { label: "Abrir o meu processo", path: "{access_path}" },
    },
    "dossier.changes_requested": {
      subject: "Alterações pedidas para o processo {reference}",
      preheader: "O seu consultor deixou um comentário.",
      title: "Alguns dados precisam da sua atenção.",
      paragraphs: ["Comentário: {comment}", "Abra o processo seguro para o atualizar e enviar uma nova revisão."],
      cta: { label: "Atualizar o meu processo", path: "{access_path}" },
    },
    "dossier.ready_to_accept": {
      subject: "O seu orçamento Studio ATS está pronto - {reference}",
      preheader: "Reveja o caderno e o orçamento bloqueados.",
      title: "Os seus documentos estão prontos para aceitação.",
      paragraphs: ["Reveja o caderno de encargos e o orçamento exatos preparados para o processo {reference}.", "Quando estiver pronto, peça o código de utilização única para confirmar a sua aceitação."],
      cta: { label: "Rever os meus documentos", path: "{access_path}" },
    },
    "dossier.otp": {
      subject: "O seu código de aceitação Studio ATS",
      preheader: "Este código expira em 10 minutos.",
      title: "O seu código de utilização única é {otp}.",
      paragraphs: ["Introduza este código para aceitar o processo {reference}.", "Expira em 10 minutos e só pode ser usado uma vez."],
    },
    "dossier.payment": {
      subject: "Conclua o pagamento Studio ATS - {reference}",
      preheader: "O seu processo foi contra-assinado.",
      title: "O seu processo Studio ATS está totalmente aceite.",
      paragraphs: ["A Studio ATS contra-assinou os mesmos documentos bloqueados.", "Efetue o primeiro pagamento através da Stripe para que a encomenda se torne firme."],
      cta: { label: "Pagar em segurança", path: "{payment_url}" },
    },
    "dossier.active": {
      subject: "A sua encomenda Studio ATS está confirmada - {reference}",
      preheader: "Pagamento confirmado.",
      title: "O seu projeto Studio ATS pode começar.",
      paragraphs: ["Recebemos o primeiro pagamento do processo {reference}.", "Os seus documentos aceites e o registo de prova continuam disponíveis no seu processo seguro."],
      cta: { label: "Abrir o meu processo", path: "{access_path}" },
    },
    "system.test": {
      subject: "Studio ATS — e-mail de teste",
      preheader: "O envio de e-mails funciona.",
      title: "O envio de e-mails funciona.",
      paragraphs: ["Este teste foi enviado a partir das definições de administração da Studio ATS. Se o consegue ler, os códigos de acesso e as notificações chegam aos seus utilizadores."],
    },
    "auth.login_code": {
      subject: "O seu código de acesso Studio ATS: {code}",
      preheader: "Válido durante 5 minutos, de utilização única.",
      title: "O seu código de acesso",
      paragraphs: ["Introduza este código na Studio ATS para iniciar sessão. É válido durante 5 minutos e só funciona uma vez."],
      highlight: "{code}",
      footnote: "Se não pediu este código, ignore este e-mail e nunca o partilhe.",
    },
  },
};

export default pt;
