import type { Copy } from "./copy.ts";

/** Italiano — transactional emails. A pending commission is never described as earned. */
const it: Copy = {
  common: {
    signature: "Il team Studio ATS",
    footer: "Riceve questa e-mail in relazione al suo account o alla sua richiesta Studio ATS. Si tratta di un messaggio transazionale.",
    pendingNote: "Una commissione in attesa non è ancora acquisita: diventa disponibile al termine del periodo di convalida, in assenza di rimborsi o contestazioni.",
  },
  templates: {
    "affiliate.welcome": {
      subject: "Benvenuto in Studio ATS",
      preheader: "La sua area partner è pronta.",
      title: "Benvenuto in Studio ATS.",
      paragraphs: [
        "La sua area partner è pronta. Il suo codice di referral è {code}.",
        "Condivida il suo link, segua i suoi contatti e trovi ogni vendita, commissione e rinnovo in un unico posto.",
      ],
      cta: { label: "Apri la mia dashboard", path: "/dashboard" },
    },
    "affiliate.new_lead": {
      subject: "Le è stato attribuito un nuovo contatto",
      preheader: "È arrivata una nuova richiesta tramite il suo link.",
      title: "Le è stato attribuito un nuovo contatto.",
      paragraphs: ["{who} ha chiesto informazioni su Studio ATS tramite il suo link.", "Il team Studio ATS gestisce il primo contatto. Può seguirlo dalla sua dashboard."],
      cta: { label: "Vedi i miei contatti", path: "/dashboard/prospects" },
    },
    "affiliate.appointment": {
      subject: "Un contatto ha richiesto un appuntamento",
      preheader: "È arrivata una richiesta di appuntamento tramite il suo link.",
      title: "Un contatto ha richiesto un appuntamento.",
      paragraphs: ["{who} ha richiesto un appuntamento{when}."],
      cta: { label: "Vedi i miei contatti", path: "/dashboard/prospects" },
    },
    "affiliate.sale_detected": {
      subject: "Nuova vendita Studio ATS — commissione di {commission} in attesa",
      preheader: "{gross} generati. Commissione in attesa di convalida.",
      title: "È stata confermata una vendita.",
      paragraphs: [
        "Vendita {sale_ref}: {gross} pagati dal cliente.",
        "La sua commissione: {commission} — stato: in attesa. Disponibilità prevista il {available_on}.",
      ],
      cta: { label: "Segui le mie commissioni", path: "/dashboard/commissions" },
      footnote: "pendingNote",
    },
    "affiliate.renewal": {
      subject: "Un cliente ha rinnovato — commissione di {commission} in attesa",
      preheader: "Un contratto da lei portato è stato rinnovato.",
      title: "Un cliente da lei portato ha appena rinnovato.",
      paragraphs: [
        "Rinnovo {sale_ref}: {gross} pagati.",
        "La sua commissione di rinnovo: {commission} — stato: in attesa. Disponibilità prevista: {available_on}.",
      ],
      cta: { label: "Vedi il mio portafoglio ricorrente", path: "/dashboard/recurring" },
      footnote: "pendingNote",
    },
    "affiliate.commission_available": {
      subject: "{commission} sono ora disponibili",
      preheader: "La sua commissione ha superato il periodo di convalida.",
      title: "La sua commissione è ora disponibile.",
      paragraphs: ["{commission} hanno superato il periodo di convalida e sono ora disponibili per il pagamento."],
      cta: { label: "Vedi il mio saldo", path: "/dashboard/payouts" },
    },
    "affiliate.payout_sent": {
      subject: "Pagamento inviato: {amount}",
      preheader: "Le è stato emesso un pagamento.",
      title: "Le è stato inviato un pagamento.",
      paragraphs: ["Pagamento {payout_ref}: {amount}. A seconda della banca, i fondi arrivano di solito entro pochi giorni lavorativi."],
      cta: { label: "Vedi i miei pagamenti", path: "/dashboard/payouts" },
    },
    "affiliate.customer_cancelled": {
      subject: "Un contratto da lei portato è stato disdetto",
      preheader: "Un cliente non rinnoverà.",
      title: "Un contratto da lei portato è stato disdetto.",
      paragraphs: [
        "Il cliente {customer_ref} non rinnoverà. Il contratto termina il {ends_on}.",
        "Le commissioni già convalidate per i periodi pagati non sono interessate. Questo contratto non genererà commissioni di rinnovo.",
      ],
      cta: { label: "Vedi il mio portafoglio ricorrente", path: "/dashboard/recurring" },
    },
    "customer.welcome": {
      subject: "Benvenuto in Studio ATS",
      preheader: "Il suo pagamento è confermato.",
      title: "Benvenuto in Studio ATS.",
      paragraphs: [
        "Il suo pagamento è confermato e il suo abbonamento {product} è attivo.",
        "Il nostro team la contatterà a breve per iniziare. Ricevuta e fatture le vengono inviate dal nostro fornitore di pagamenti, Stripe.",
      ],
    },
    "customer.order_confirmation": {
      subject: "Il suo ordine Studio ATS {sale_ref}",
      preheader: "Ordine confermato.",
      title: "Il suo ordine è confermato.",
      paragraphs: ["Ordine {sale_ref}: {amount} pagati."],
    },
    "customer.renewal_receipt": {
      subject: "Il suo abbonamento Studio ATS è stato rinnovato",
      preheader: "Rinnovo confermato.",
      title: "Il suo abbonamento è stato rinnovato.",
      paragraphs: ["Rinnovo {sale_ref}: {amount} pagati. Grazie per la fiducia."],
    },
    "customer.payment_failed": {
      subject: "Il suo pagamento Studio ATS non è andato a buon fine",
      preheader: "Aggiorni il suo metodo di pagamento.",
      title: "Il suo pagamento non è andato a buon fine.",
      paragraphs: ["Non siamo riusciti a incassare {amount}. La sua banca potrebbe aver rifiutato il pagamento. Riproveremo automaticamente; può anche aggiornare il metodo di pagamento dal link nell’e-mail del nostro fornitore di pagamenti."],
    },
    "customer.cancellation": {
      subject: "La sua disdetta Studio ATS è confermata",
      preheader: "Disdetta confermata.",
      title: "La sua disdetta è confermata.",
      paragraphs: ["Il suo abbonamento non sarà rinnovato. Mantiene l’accesso fino al {ends_on}.", "Se si tratta di un errore, risponda semplicemente a questa e-mail."],
    },
    "lead.confirmation": {
      subject: "Abbiamo ricevuto la sua richiesta — Studio ATS",
      preheader: "La ricontatteremo a breve.",
      title: "Grazie, abbiamo ricevuto la sua richiesta.",
      paragraphs: ["Un membro del team Studio ATS la contatterà a breve."],
    },
    "lead.appointment_confirmation": {
      subject: "La sua richiesta di appuntamento Studio ATS",
      preheader: "Confermeremo l’orario con lei.",
      title: "Abbiamo ricevuto la sua richiesta di appuntamento.",
      paragraphs: ["Confermeremo l’orario con lei{when}."],
    },
    "dossier.invite": {
      subject: "Compili il suo capitolato Studio ATS - {reference}",
      preheader: "Il suo spazio di progetto sicuro è pronto.",
      title: "Ci parli del suo progetto.",
      paragraphs: ["Il suo consulente Studio ATS ha creato il fascicolo {reference}.", "Usi il link sicuro qui sotto per compilare il capitolato. Il link è personale e scade automaticamente."],
      cta: { label: "Apri il mio fascicolo", path: "{access_path}" },
    },
    "dossier.changes_requested": {
      subject: "Modifiche richieste per il fascicolo {reference}",
      preheader: "Il suo consulente ha lasciato un commento.",
      title: "Alcuni dettagli richiedono la sua attenzione.",
      paragraphs: ["Commento: {comment}", "Apra il fascicolo sicuro per aggiornarlo e inviare una nuova revisione."],
      cta: { label: "Aggiorna il mio fascicolo", path: "{access_path}" },
    },
    "dossier.ready_to_accept": {
      subject: "Il suo preventivo Studio ATS è pronto - {reference}",
      preheader: "Riveda il capitolato e il preventivo bloccati.",
      title: "I suoi documenti sono pronti per l’accettazione.",
      paragraphs: ["Riveda il capitolato e il preventivo esatti preparati per il fascicolo {reference}.", "Quando è pronto, richieda il codice monouso per confermare l’accettazione."],
      cta: { label: "Rivedi i miei documenti", path: "{access_path}" },
    },
    "dossier.otp": {
      subject: "Il suo codice di accettazione Studio ATS",
      preheader: "Questo codice scade tra 10 minuti.",
      title: "Il suo codice monouso è {otp}.",
      paragraphs: ["Inserisca questo codice per accettare il fascicolo {reference}.", "Scade tra 10 minuti e può essere usato una sola volta."],
    },
    "dossier.payment": {
      subject: "Completi il pagamento Studio ATS - {reference}",
      preheader: "Il suo fascicolo è stato controfirmato.",
      title: "Il suo fascicolo Studio ATS è stato accettato da entrambe le parti.",
      paragraphs: ["Studio ATS ha controfirmato gli stessi documenti bloccati.", "Effettui il primo pagamento tramite Stripe per rendere l’ordine vincolante."],
      cta: { label: "Paga in sicurezza", path: "{payment_url}" },
    },
    "dossier.active": {
      subject: "Il suo ordine Studio ATS è confermato - {reference}",
      preheader: "Pagamento confermato.",
      title: "Il suo progetto Studio ATS può iniziare.",
      paragraphs: ["Abbiamo ricevuto il primo pagamento per il fascicolo {reference}.", "I documenti accettati e il registro di prova restano disponibili nel suo fascicolo sicuro."],
      cta: { label: "Apri il mio fascicolo", path: "{access_path}" },
    },
    "system.test": {
      subject: "Studio ATS — e-mail di prova",
      preheader: "L’invio delle e-mail funziona.",
      title: "L’invio delle e-mail funziona.",
      paragraphs: ["Questa prova è stata inviata dalle impostazioni di amministrazione di Studio ATS. Se riesce a leggerla, i codici di accesso e le notifiche raggiungono i suoi utenti."],
    },
    "auth.login_code": {
      subject: "Il suo codice di accesso Studio ATS: {code}",
      preheader: "Valido 5 minuti, utilizzabile una sola volta.",
      title: "Il suo codice di accesso",
      paragraphs: ["Inserisca questo codice su Studio ATS per accedere. È valido per 5 minuti e funziona una sola volta."],
      highlight: "{code}",
      footnote: "Se non ha richiesto questo codice, ignori questa e-mail e non condivida mai il codice.",
    },
  },
};

export default it;
