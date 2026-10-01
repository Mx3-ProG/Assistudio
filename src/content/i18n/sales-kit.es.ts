import type { KitEntry } from "../sales-kit.ts";

/** Sales kit — Spanish. Same order as the English entries. */
const entries: KitEntry[] = [
  ["email", "Primer contacto — oficios con portafolio",
`Asunto: [Empresa] — convertir visitantes en citas reservadas

Hola [Nombre]:

Descubrí [Empresa] y me gustó mucho [proyecto concreto].

Una pregunta rápida: cuando alguien descubre tu trabajo en internet, ¿qué pasa después? La mayoría de los profesionales con los que hablo reciben solicitudes por formularios, Instagram y correo — sin presupuesto, plazos ni detalles del proyecto.

Studio ATS lo resuelve. Es un estudio comercial online que presenta tu trabajo, cualifica cada solicitud y reserva la cita automáticamente. Lo construimos y lo gestionamos por ti.

¿Te serviría echarle un vistazo de 10 minutos? Aquí tienes una presentación: [tu enlace]

Un saludo,
[Tu nombre]`],
  ["email", "Seguimiento a los 3 días",
`Asunto: Re: [Empresa] — convertir visitantes en citas reservadas

Hola [Nombre]:

Solo vuelvo a subir este mensaje. Si las solicitudes sin presupuesto ni plazos te resultan familiares, Studio ATS merece 10 minutos: [tu enlace]

Si ahora no es una prioridad, no pasa nada — dímelo y no volveré a escribirte.

[Tu nombre]`],
  ["whatsapp", "Presentación breve",
`Hola [Nombre] 👋 He visto tu trabajo en [proyecto], muy bonito. Trabajo con Studio ATS: convierte tu portafolio en un espacio que cualifica las solicitudes y reserva llamadas automáticamente. ¿Te envío una presentación de 2 minutos?`],
  ["whatsapp", "Después de una llamada",
`¡Gracias por la llamada, [Nombre]! Aquí tienes la página de Studio ATS de la que hablamos: [tu enlace]. Si tienes cualquier pregunta, dímelo.`],
  ["linkedin", "Nota de conexión",
`Hola [Nombre], ayudo a [profesión] a convertir su visibilidad online en citas cualificadas. Me encantaría conectar.`],
  ["linkedin", "Mensaje tras conectar",
`Gracias por conectar, [Nombre]. He visto que [Empresa] trabaja en [tipo de proyecto]. ¿Cómo suelen contactarte los nuevos clientes? Trabajo con Studio ATS, que cualifica las solicitudes y reserva llamadas de descubrimiento automáticamente. Si te resulta útil, te comparto una breve presentación: [tu enlace]`],
  ["instagram", "DM — creadores con portafolio",
`¡Hola! Tu feed es precioso 🙌 Una pregunta: cuando alguien quiere reservarte, ¿simplemente te escribe por DM? Studio ATS convierte tu portafolio en un espacio de reservas que pide fecha, presupuesto y tipo de proyecto desde el principio. ¿Te paso el enlace?`],
  ["cold_call", "Guion de llamada en frío",
`1. Apertura — «Hola [Nombre], soy [Tu nombre]. Seré breve: ayudo a [profesión] a convertir a los visitantes de su web en citas cualificadas. ¿Tienes 30 segundos?»
2. Pregunta — «Hoy, cuando alguien encuentra tu trabajo en internet, ¿cómo te contacta?»
3. Escucha. Reformula el problema (solicitudes dispersas, sin cualificación, seguimientos olvidados).
4. Propuesta — «Studio ATS es un estudio comercial construido para ti: portafolio, cualificación de solicitudes, citas, correos y seguimientos automáticos. El equipo lo construye y lo gestiona.»
5. Siguiente paso — «¿Te envío la presentación y reservamos 15 minutos para revisarla?»`],
  ["objection", "«Ya tengo una web».",
`Genial — Studio ATS no pretende sustituir una buena web. La cuestión es qué pasa después de la visita: ¿se cualifican las solicitudes? ¿Los seguimientos son automáticos? ¿Sabes qué fuentes traen clientes reales? La web es una pieza; Studio ATS es todo el camino hasta la cita.`],
  ["objection", "«Es demasiado caro».",
`Es una pregunta justa. ¿Cuánto vale para ti un cliente nuevo? Studio ATS cuesta 6.000 € al año, todo incluido. Para un profesional cuyos clientes tienen un valor alto, la cuestión es si ayuda a convertir las solicitudes que ya recibes. [No prometas resultados — deja que el prospecto haga sus propias cuentas.]`],
  ["objection", "«Solo trabajo con Instagram».",
`Instagram es excelente para que te descubran. Studio ATS es donde esa atención se convierte en una solicitud estructurada — con fecha, presupuesto y detalles del proyecto — en lugar de otro DM que perseguir. Complementa Instagram; no lo sustituye.`],
  ["objection", "«No necesito automatización».",
`Entendido. Aquí la automatización solo significa que el correo de confirmación, el recordatorio y el seguimiento salen a tiempo — lo que se olvida en las semanas con mucho trabajo. Tú sigues controlando cada conversación.`],
  ["objection", "«Tengo que pensarlo».",
`Por supuesto. Para ayudarte a decidir: ¿qué tendría que cumplirse para que valiera la pena para ti? Te envío la presentación [tu enlace] y te escribo el [día] — ¿te parece bien?`],
];

export default entries;
