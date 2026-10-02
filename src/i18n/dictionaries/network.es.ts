import type { NetworkDictionary } from "./network.en";

const net: NetworkDictionary = {
  nav: "Red",
  helpNav: "Solicitudes de ayuda",
  title: "Red de socios",
  subtitle: "Cada socio con su padrino, sus ahijados, prospectos, facturación y comisiones — y quién necesita algo de ti.",
  kpi: {
    members: "Socios", approved: "{n} aprobados", active30d: "Activos en 30 días", prospects: "Prospectos", paidSales: "Ventas pagadas",
    revenue: "Facturación atribuida", owed: "Comisiones adeudadas", owedHint: "Disponibles, por pagar", paid: "Comisiones pagadas",
    pending: "En validación", pendingHint: "Aún no ganadas", conversion: "Conversión de la red", needAttention: "Por atender", openHelp: "Solicitudes de ayuda abiertas",
  },
  conversionHint: "Conversión = primeras ventas pagadas ÷ prospectos (CRM + leads entrantes; un comprador que nunca fue prospecto cuenta como uno). Clasificación desde {n} prospectos.",
  attention: { title: "Por atender", empty: "Nadie necesita nada ahora mismo.", more: "+{n} más" },
  needs: {
    application: "Solicitud por revisar", help: "Solicitud de ayuda abierta", contract: "Contrato esperándote", payout_due: "Pago pendiente",
    fraud: "Señal de fraude", disputed: "Comisión en disputa", onboarding: "Onboarding sin terminar", inactive: "Inactivo desde hace 30+ días",
  },
  rank: {
    title: "Clasificaciones", revenue: "Mayor facturación", prospects: "Más prospectos", recruits: "Más ahijados", conversion: "Mejor conversión",
    sales: "Más ventas", earned: "Más ganado", earnedHint: "Disponible + pagado", empty: "Aún no hay datos.",
  },
  table: {
    title: "Todos los socios", search: "Nombre, email, código, país, padrino…", apply: "Aplicar",
    filters: { all: "Todos", needs: "Por atender", pending: "Solicitudes", inactive: "Inactivos", top: "Han vendido" },
    sortBy: "Ordenar",
    sorts: { needs: "Prioridad", recent: "Más recientes", name: "Nombre", revenue: "Facturación", prospects: "Prospectos", recruits: "Ahijados", conversion: "Conversión", sales: "Ventas", earned: "Ganado", owed: "Adeudado" },
    partner: "Socio", sponsor: "Padrino", recruits: "Ahijados", prospects: "Prospectos", sales: "Ventas", conversion: "Conv.",
    revenue: "Facturación", owed: "Adeudado", paid: "Pagado", pending: "En validación", noSponsor: "—", count: "{n} socios", empty: "Ningún socio coincide.", staff: "Equipo",
  },
  tree: { title: "Árbol de apadrinamiento", hint: "Quién reclutó a quién. Abre un socio para verlo todo.", network: "{n} en su red", sales: "{n} ventas" },
  detail: {
    back: "Red", since: "Socio desde el {date}", notFound: "Este socio no existe.", sponsor: "Padrino", noSponsor: "Se unió sin padrino",
    recruits: "Ahijados", noRecruits: "Aún no tiene ahijados.", noNeeds: "Nada que hacer para este socio.", finance: "Finanzas de este socio",
    money: {
      title: "Dinero", revenue: "Facturación atribuida", available: "Adeudado ahora (disponible)", paid: "Ya pagado",
      pending: "En validación (no ganado)", disputed: "En revisión", sponsor: "De ello, de sus ahijados", minimum: "Pago mínimo: {amount}",
    },
    stats: {
      title: "Actividad", clicks: "Clics (30 días)", lastActivity: "Última actividad", never: "Sin actividad", conversion: "Conversión",
      won: "Ganados en el CRM", leads: "Leads entrantes", renewals: "Renovaciones pagadas",
    },
    sections: { prospects: "Prospectos", leads: "Leads entrantes", sales: "Ventas", commissions: "Comisiones", payouts: "Pagos", help: "Solicitudes de ayuda", contracts: "Expedientes de contrato" },
    prospect: { contact: "Contacto", stage: "Etapa", next: "Próxima acción", value: "Potencial", source: "Origen", notes: "Notas", added: "Añadido" },
    commissionRole: "Venta {sale}", empty: "Nada por ahora.", open: "Abrir",
  },
  statuses: { open: "Abierta", in_progress: "En curso", resolved: "Resuelta", closed: "Cerrada" },
  categories: {
    commission: "Comisión", payout: "Pago", contract: "Contrato / expediente", prospect: "Prospecto", sale: "Venta",
    account: "Cuenta", technical: "Problema técnico", training: "Formación / cómo vender", other: "Otro",
  },
  urgencies: { low: "Baja", normal: "Normal", high: "Urgente" },
  admin: {
    title: "Solicitudes de ayuda",
    subtitle: "Lo que los socios pidieron al equipo, con su cuenta tal como estaba al pedirlo. Cada miembro del equipo también la recibe por email.",
    tabs: { open: "Por atender", all: "Todas" }, empty: "No hay solicitudes de ayuda.", context: "Cuenta en el momento de la solicitud", related: "Relacionado",
    from: "Enviada desde", note: "Respuesta al socio (opcional, la verá)", teamNote: "Respuesta del equipo", take: "Me encargo",
    resolve: "Marcar resuelta", close: "Cerrar", reopen: "Reabrir", partner: "Ficha del socio", saved: "Guardado",
  },
  ctx: {
    affiliate_status: "Estado", code: "Código", sponsor: "Padrino", recruits: "Ahijados", prospects: "Prospectos", leads: "Leads entrantes",
    paid_sales: "Ventas pagadas", revenue_cents: "Facturación", available_cents: "Adeudado", paid_cents: "Pagado", pending_cents: "En validación (no ganado)",
    open_dossiers: "Expedientes abiertos", open_requests: "Solicitudes abiertas", onboarding_completed: "Onboarding terminado", country: "País",
    prospect: "Prospecto", dossier: "Expediente",
  },
  help: {
    nav: "Ayuda",
    title: "Pedir ayuda al equipo de Studio ATS",
    subtitle: "Cuéntanos qué necesitas. El equipo recibe tu solicitud por email con el contexto de tu cuenta (prospectos, ventas, comisiones), así no tienes que volver a explicarlo todo.",
    category: "Tema", urgency: "Urgencia", urgentHint: "Urgente = un cliente espera o hay dinero bloqueado.",
    subject: "Asunto", subjectPlaceholder: "En pocas palabras", message: "Tu solicitud",
    messagePlaceholder: "Qué pasó, qué ya intentaste, qué necesitas de nosotros.",
    prospect: "Prospecto relacionado (opcional)", dossier: "Expediente de contrato relacionado (opcional)", none: "Ninguno",
    shared: "Compartido con el equipo: tu estado, tu padrino, tus números de prospectos y ventas, tus saldos y el prospecto o expediente elegido.",
    send: "Enviar al equipo", sending: "Enviando…",
    sent: "Solicitud {ref} enviada. El equipo fue avisado por email; recibirás una notificación cuando avance.",
    history: "Mis solicitudes", empty: "Aún no has pedido ayuda.", teamNote: "Respuesta del equipo", messages: "¿Prefieres chatear? Escribe al equipo",
    errors: {
      invalid: "Indica un asunto (mín. 3 caracteres) y tu solicitud (mín. 10 caracteres).",
      rate_limited: "Demasiadas solicitudes en la última hora. Espera un poco o usa Mensajes.",
      generic: "No se pudo enviar la solicitud. Inténtalo de nuevo o usa Mensajes.",
    },
    ask: "¿Necesitas ayuda?",
  },
};

export default net;
