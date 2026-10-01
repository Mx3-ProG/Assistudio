import type { Copy } from "./copy.ts";

/** Español — transactional emails. A pending commission is never described as earned. */
const es: Copy = {
  common: {
    signature: "El equipo de Studio ATS",
    footer: "Recibe este correo en relación con su cuenta o su solicitud en Studio ATS. Es un mensaje transaccional.",
    pendingNote: "Una comisión pendiente aún no está adquirida: pasa a estar disponible al terminar el periodo de validación, sin reembolso ni disputa.",
  },
  templates: {
    "affiliate.welcome": {
      subject: "Bienvenido a Studio ATS",
      preheader: "Su espacio de socio está listo.",
      title: "Bienvenido a Studio ATS.",
      paragraphs: [
        "Su espacio de socio está listo. Su código de referido es {code}.",
        "Comparta su enlace, siga a sus prospectos y vea cada venta, comisión y renovación en un solo lugar.",
      ],
      cta: { label: "Abrir mi panel", path: "/dashboard" },
    },
    "affiliate.new_lead": {
      subject: "Se le ha atribuido un nuevo prospecto",
      preheader: "Ha llegado una nueva solicitud a través de su enlace.",
      title: "Se le ha atribuido un nuevo prospecto.",
      paragraphs: ["{who} ha pedido información sobre Studio ATS a través de su enlace.", "El equipo de Studio ATS se encarga del primer contacto. Puede seguirlo desde su panel."],
      cta: { label: "Ver mis prospectos", path: "/dashboard/prospects" },
    },
    "affiliate.appointment": {
      subject: "Un prospecto ha solicitado una cita",
      preheader: "Ha llegado una solicitud de cita a través de su enlace.",
      title: "Un prospecto ha solicitado una cita.",
      paragraphs: ["{who} ha solicitado una cita{when}."],
      cta: { label: "Ver mis prospectos", path: "/dashboard/prospects" },
    },
    "affiliate.sale_detected": {
      subject: "Nueva venta de Studio ATS — comisión de {commission} pendiente",
      preheader: "{gross} generados. Comisión pendiente de validación.",
      title: "Se ha confirmado una venta.",
      paragraphs: [
        "Venta {sale_ref}: {gross} pagados por el cliente.",
        "Su comisión: {commission} — estado: pendiente. Disponibilidad prevista el {available_on}.",
      ],
      cta: { label: "Seguir mis comisiones", path: "/dashboard/commissions" },
      footnote: "pendingNote",
    },
    "affiliate.renewal": {
      subject: "Un cliente ha renovado — comisión de {commission} pendiente",
      preheader: "Un contrato que usted aportó se ha renovado.",
      title: "Un cliente que usted aportó acaba de renovar.",
      paragraphs: [
        "Renovación {sale_ref}: {gross} pagados.",
        "Su comisión de renovación: {commission} — estado: pendiente. Disponibilidad prevista: {available_on}.",
      ],
      cta: { label: "Ver mi cartera recurrente", path: "/dashboard/recurring" },
      footnote: "pendingNote",
    },
    "affiliate.commission_available": {
      subject: "{commission} ya están disponibles",
      preheader: "Su comisión ha superado el periodo de validación.",
      title: "Su comisión ya está disponible.",
      paragraphs: ["{commission} han superado el periodo de validación y ya están disponibles para el pago."],
      cta: { label: "Ver mi saldo", path: "/dashboard/payouts" },
    },
    "affiliate.payout_sent": {
      subject: "Pago enviado: {amount}",
      preheader: "Se le ha emitido un pago.",
      title: "Se le ha enviado un pago.",
      paragraphs: ["Pago {payout_ref}: {amount}. Según su banco, los fondos suelen llegar en pocos días hábiles."],
      cta: { label: "Ver mis pagos", path: "/dashboard/payouts" },
    },
    "affiliate.customer_cancelled": {
      subject: "Se ha cancelado un contrato que usted aportó",
      preheader: "Un cliente no renovará.",
      title: "Se ha cancelado un contrato que usted aportó.",
      paragraphs: [
        "El cliente {customer_ref} no renovará. El contrato termina el {ends_on}.",
        "Las comisiones ya validadas por periodos pagados no se ven afectadas. Este contrato no generará comisión de renovación.",
      ],
      cta: { label: "Ver mi cartera recurrente", path: "/dashboard/recurring" },
    },
    "customer.welcome": {
      subject: "Bienvenido a Studio ATS",
      preheader: "Su pago está confirmado.",
      title: "Bienvenido a Studio ATS.",
      paragraphs: [
        "Su pago está confirmado y su suscripción {product} está activa.",
        "Nuestro equipo se pondrá en contacto con usted en breve para empezar. Nuestro proveedor de pagos, Stripe, le envía el recibo y las facturas.",
      ],
    },
    "customer.order_confirmation": {
      subject: "Su pedido de Studio ATS {sale_ref}",
      preheader: "Pedido confirmado.",
      title: "Su pedido está confirmado.",
      paragraphs: ["Pedido {sale_ref}: {amount} pagados."],
    },
    "customer.renewal_receipt": {
      subject: "Su suscripción a Studio ATS se ha renovado",
      preheader: "Renovación confirmada.",
      title: "Su suscripción se ha renovado.",
      paragraphs: ["Renovación {sale_ref}: {amount} pagados. Gracias por su confianza."],
    },
    "customer.payment_failed": {
      subject: "Su pago de Studio ATS no se ha podido realizar",
      preheader: "Actualice su método de pago.",
      title: "Su pago no se ha podido realizar.",
      paragraphs: ["No hemos podido cobrar {amount}. Es posible que su banco haya rechazado el pago. Volveremos a intentarlo automáticamente; también puede actualizar su método de pago desde el enlace del correo de nuestro proveedor de pagos."],
    },
    "customer.cancellation": {
      subject: "Su cancelación de Studio ATS está confirmada",
      preheader: "Cancelación confirmada.",
      title: "Su cancelación está confirmada.",
      paragraphs: ["Su suscripción no se renovará. Mantiene el acceso hasta el {ends_on}.", "Si se trata de un error, simplemente responda a este correo."],
    },
    "lead.confirmation": {
      subject: "Hemos recibido su solicitud — Studio ATS",
      preheader: "Le responderemos en breve.",
      title: "Gracias, hemos recibido su solicitud.",
      paragraphs: ["Un miembro del equipo de Studio ATS se pondrá en contacto con usted en breve."],
    },
    "lead.appointment_confirmation": {
      subject: "Su solicitud de cita con Studio ATS",
      preheader: "Confirmaremos la hora con usted.",
      title: "Hemos recibido su solicitud de cita.",
      paragraphs: ["Confirmaremos la hora con usted{when}."],
    },
    "dossier.invite": {
      subject: "Complete su pliego de requisitos de Studio ATS - {reference}",
      preheader: "Su espacio de proyecto seguro está listo.",
      title: "Háblenos de su proyecto.",
      paragraphs: ["Su asesor de Studio ATS ha creado el expediente {reference}.", "Use el enlace seguro de abajo para completar su pliego de requisitos. El enlace es personal y caduca automáticamente."],
      cta: { label: "Abrir mi expediente", path: "{access_path}" },
    },
    "dossier.changes_requested": {
      subject: "Cambios solicitados en el expediente {reference}",
      preheader: "Su asesor ha dejado un comentario.",
      title: "Algunos datos requieren su atención.",
      paragraphs: ["Comentario: {comment}", "Abra el expediente seguro para actualizarlo y enviar una nueva revisión."],
      cta: { label: "Actualizar mi expediente", path: "{access_path}" },
    },
    "dossier.ready_to_accept": {
      subject: "Su presupuesto de Studio ATS está listo - {reference}",
      preheader: "Revise el pliego y el presupuesto bloqueados.",
      title: "Sus documentos están listos para su aceptación.",
      paragraphs: ["Revise el pliego y el presupuesto exactos preparados para el expediente {reference}.", "Cuando esté listo, solicite el código de un solo uso para confirmar su aceptación."],
      cta: { label: "Revisar mis documentos", path: "{access_path}" },
    },
    "dossier.otp": {
      subject: "Su código de aceptación de Studio ATS",
      preheader: "Este código caduca en 10 minutos.",
      title: "Su código de un solo uso es {otp}.",
      paragraphs: ["Introduzca este código para aceptar el expediente {reference}.", "Caduca en 10 minutos y solo puede usarse una vez."],
    },
    "dossier.payment": {
      subject: "Complete el pago de Studio ATS - {reference}",
      preheader: "Su expediente ha sido contrafirmado.",
      title: "Su expediente de Studio ATS está totalmente aceptado.",
      paragraphs: ["Studio ATS ha contrafirmado los mismos documentos bloqueados.", "Realice el primer pago a través de Stripe para que el pedido sea firme."],
      cta: { label: "Pagar de forma segura", path: "{payment_url}" },
    },
    "dossier.active": {
      subject: "Su pedido de Studio ATS está confirmado - {reference}",
      preheader: "Pago confirmado.",
      title: "Su proyecto Studio ATS puede empezar.",
      paragraphs: ["Hemos recibido el primer pago del expediente {reference}.", "Sus documentos aceptados y el registro de prueba siguen disponibles en su expediente seguro."],
      cta: { label: "Abrir mi expediente", path: "{access_path}" },
    },
    "system.test": {
      subject: "Studio ATS — correo de prueba",
      preheader: "El envío de correos funciona.",
      title: "El envío de correos funciona.",
      paragraphs: ["Esta prueba se ha enviado desde la configuración de administración de Studio ATS. Si puede leerla, los códigos de acceso y las notificaciones pueden llegar a sus usuarios."],
    },
    "auth.login_code": {
      subject: "Su código de acceso a Studio ATS: {code}",
      preheader: "Válido 5 minutos, de un solo uso.",
      title: "Su código de acceso",
      paragraphs: ["Introduzca este código en Studio ATS para iniciar sesión. Es válido durante 5 minutos y solo funciona una vez."],
      highlight: "{code}",
      footnote: "Si no ha solicitado este código, ignore este correo y no lo comparta nunca.",
    },
  },
};

export default es;
